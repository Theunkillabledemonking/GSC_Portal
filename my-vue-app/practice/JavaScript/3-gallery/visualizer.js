// 오디오 컨텍스트는 하나만 생성해서 재사용 (싱글턴처럼 사용)
let audioContext = null;

/**
 * Web Audio API를 설정하고 analyser를 구성하는 함수
 * @param {HTMLAudioElement} audioElement - 재생할 오디오 요소
 * @returns {{analyser: *, dataArray: Uint8Array, bufferLength}}
 */
function setupAudioContext(audioElement) {
    let analyser = null;
    if (!audioContext) {
        // 호환성을 위해 AudioContext 생성
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // 주파수 분석용 analyser 노드 생성
    analyser = audioContext.createAnalyser();
    if (!analyser) throw new Error("failed!");

    // 오디오 소스를 context에 연결 (MediaElementSource는 audio/video 요소에만 가능)
    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser); // source -> analyser
    analyser.connect(audioContext.destination); // analyser -> 출력 (스피커)

    // 분석 설정: FFT 사이즈 (256 -> 데이터 길이 128)
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    return {
        analyser,
        dataArray: new Uint8Array(bufferLength), // 0~255 사이의 주파수 세기 배열
        bufferLength,
    };
}

/**
 * 시각화 캔버스를 생성하고 주파수 기반 원형 비주얼을 그리는 함수
 * @param {HTMLAudioElement} audio - 시각화할 오디오 요소
 * @param {number} width - 캔버스 너비
 * @param {number} height - 캔버스 높이
 * @returns {object} - { renderer, play(), pause() }
 */
export function getVisualizer(audio, width, height) {
    // 캔버스 요소 생성 및 설정
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    // 초기 배경 색상 흰색
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    // analyser와 주파수 데이터 초기화
    const { analyser, dataArray, bufferLength } = setupAudioContext(audio);

    // 애니메이션 핸들 및 상태 변수
    let handle = null;                          // requestAnimationFrame(핸들)
    let rotation = 0;                           // 회전 각도
    let hue = Math.random() * 360;      // 시작 색상(무작위)
    let interval = null;                        // 색상 회전을 위한 setInterval 핸들


    /**
     * 회전 각도 업데이트 함수 (0 -> 2pi 라디안)
     */
    function updateRotation() {
        rotation += 0.02; // 한 프레임마다 조금씩 회전
        if (rotation >= 2 * Math.PI) {
            rotation = 0;
        }
    }

    /**
     * 실제 비주얼을 그리는 핵심 애니메이션 함수
     * - 극 좌표계를 주파수 데이터를 원형으로 배치
     * - 회전 + 색상 변화 포함
     */
    function drawVisualizer() {
        // 다음 프레임을 예약
        handle = requestAnimationFrame(drawVisualizer);

        // 현재 주파수 데이터를 가져와 dataArray에 저장
        analyser.getByteFrequencyData(dataArray);

        // 약간 투명한 흰 배경을 덮어 -> 잔상이 남는 느낌 연출
        ctx.fillStyle = "rgba(255, 255, 255, 0.01)";
        ctx.fillRect(0, 0, width, height);

        // 캔버스 중앙 좌표 계산
        const centerX = width / 2;
        const centerY = height / 2;

        ctx.save(); // 회전 상태 임시 저장

        // 회전 변환 설정 (중심 기준으로 회전)
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        ctx.translate(-centerX, -centerY);

        ctx.beginPath(); // 새로운 경로 시작

        // 각 주파수 구간을 하나의 점으로 표현
        for (let i = 0; i < bufferLength; ++i) {
            const barHeight = dataArray[i] / 2; // 세기를 거리(반지름)로 변환
            const radian = (i / bufferLength) * 2 * Math.PI; // 원형 각도 계싼

            // 동적인 색상 (HSL로 무지개처럼 변화)
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

            // 극좌표 -> 데카르트 좌표 변환
            const x = centerX + barHeight * Math.cos(radian);
            const y = centerY + barHeight * Math.sin(radian);

            // 첫 점이면 이동, 아니면 선 연결
            if (i === 0) {
                ctx.moveTo(x, y); // 시작점
            } else {
                ctx.lineTo(x, y); // 점을 선으로 연결
            }
        }

        ctx.closePath();    // 도형 경로 닫기
        ctx.fill();         // 내부 채우기
        ctx.restore();      // 회전 복원

        updateRotation();   // 다음 회전을 위한 각도 갱신
    }

    // 외부에서 제어 가능한 API 제공
    return {
        renderer: canvas, // 시각화된 canvas 변환
        play: () => {
            handle === null && drawVisualizer(); // 최초 실행 시만 시작
             if (interval === null) {
                 // 색상 hue 업데이트 (1초 간격 무지개 회전)
                interval = setInterval(() => {
                    hue = (hue + 10) % 360;
                }, 1000);
            }
        },
        pause: () => {
            cancelAnimationFrame(handle);   // 애니메이션 중단
            handle = null;
            clearInterval(interval);        // 색상 변경 중단
            interval = null;
        },
    };
}