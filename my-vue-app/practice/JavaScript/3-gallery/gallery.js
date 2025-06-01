import { getVisualizer } from "./visualizer.js"; // Web Audio 기반 시각화를 생성하는 유틸 함수

// 오디오 파일이 로드될 때 썸네일 대신 표시될 기본 이미지를 생성
const defaultAudioImg = document.createElement("img");
defaultAudioImg.src = "./images/mp3.png";
defaultAudioImg.onload = () => {
    console.log("audio image loaded");
};

/**
 * 미디어 갤러리 생성 함수
 * @param {string[]} imageSrcList - 이미지/비디오/오디오 경로 배열
 * @param {number} width - 캔버스 너비환
 * @param {number} row - 표시할 행 수
 * @param {number} column - 표시할 열 수
 * @returns {HTMLCanvasElement} - 렌더링된 갤러리 캔버스
 */
export default function gallery(imageSrcList, width, height, row, column) {
    console.log("gallery");

    // 상태 변수들을 초기화
    let scrollY = 0; // 현재 Y축 스크롤 위치를 저장
    let maxScrollY = 0; // 스크롤 가능한 최대 Y축 위치를 저장
    let hoverIndex = null; // 마우스가 현재 올라가 있는 아이템의 인덱스를 저장
    let selectedIndex = null; // 현재 선택된 아이템의 인덱스를 저장
    let currentScale = 1; // 마우스 호버 시 아이템 확대 배율을 저장

    const visualizerMap = new Map(); // 오디오 파일에 대한 시각화 객체 저장용

    // 캔버스 요소를 동적으로 생성
    const canvas = document.createElement("canvas");
    // 캔버스의 너비를 입력받은 width 값으로 설정
    canvas.width = width;
    // 캔버스의 높이를 입력받은 height 값으로 설정
    canvas.height = height;

    // 캔버스의 2D 렌더링 컨텍스트를 가져옵니다.
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    // 설정된 색상으로 캔버스 전체 영역을 채웁니다. (0,0 위치에서 너비, 높이만큼)
    ctx.fillRect(0, 0, width, height);

    // 갤러리 각 아이템(셀)의 너비를 계산합니다. (캔버스 너비 / 열 수)
    const itemWidth = canvas.width / column;
    // 갤러리 각 아이템(셀)의 높이를 계산합니다. (캔버스 높이 / 행 수)
    const itemHeight = canvas.height / row;
    const itemMargin = 2; // 셀 내부 여백

    // 입력받은 미디어 소스 경로 배열(imageSrcList)을 순회하며 각 아이템을 HTML 요소로 변환합니다.
    // 파일 확장자가 .mp4 또는 .mp3인 경우 createVideoItem 함수를, 그 외에는 createImageItem 함수를 호출합니다.
    const imageList = imageSrcList.map((src, index) =>
        src.endsWith(".mp4") || src.endsWith(".mp3") // 파일 경로가 .mp4 또는 .mp3로 끝나면
            ? createVideoItem(src, index) // 비디오/오디오 아이템 생성 함수 호출
            : createImageItem(src, index) // 이미지 아이템 생성 함수 호출
    );

    // 이미지 요소 생성 및 로딩 후 그리기
    function createImageItem(src, index) {
        // 새로운 <img> HTML 요소를 생성
        const image = document.createElement("img");
        // 이미지 요소의 소스(경로)를 설정
        image.src = src;
        // 이미지가 완전히 로드되면 실행될 콜백 함수를 설정
        image.onload = () => {
            // 로드된 이미지를 해당 인덱스 위치에 그리기
            drawItem(image, index);
        };
        // 생성된 이미지 요소를 반환
        return image;
    }

    // 비디오 요소 생성 후 자동 재생 및 업데이트마다 그리기
    function createVideoItem(src, index) {
        // 새로운 <video> HTML 요소를 생성
        const video = document.createElement("video");
        // 비디오 요소의 소스(경로)를 설정
        video.src = src;
        // 비디오 소리가 나지 않도록 음소거 상태로 설정합니다. (마우스 호버 시에는 소리 없이 재생)
        video.muted = true; // hover에서는 무음으로 재생
        // 비디오 데이터가 로드되어 재생 가능한 상태가 되면 실행될 콜백 함수를 설정
        video.onloadeddata = () => {
            // 비디오 재생을 시작
            video.play();
        };
        // 비디오의 현재 재생 시간이 업데이트될 때마다 실행될 콜백 함수를 설정합니다. (프레임 변경 시)
        video.ontimeupdate = () => {
            // 현재 비디오 프레임을 해당 인덱스 위치에 그림
            drawItem(video, index);
        };
        // 생성된 비디오 요소를 반환
        return video;
    }

    // 전체 아이템 개수를 기반으로 스크롤 가능한 최대 범위를 계산
    calcMaxScrollPos(imageList.length);

    // 둥근 모서리를 가진 사각형 영역으로 클리핑 경로를 설정하는 함수
    function drawClipPath(left, top, width, height, radius) {
        // 새로운 경로 그리기를 시작합니다.
        ctx.beginPath();
        // 경로의 시작점을 설정합니다. (왼쪽 상단 모서리 시작점)
        ctx.moveTo(left + radius, top);
        // 오른쪽 상단 모서리를 그립니다.
        ctx.arcTo(left + width, top, left + width, top + height, radius);
        // 오른쪽 하단 모서리를 그립니다.
        ctx.arcTo(left + width, top + height, left, top + height, radius);
        // 왼쪽 하단 모서리를 그립니다.
        ctx.arcTo(left, top + height, left, top, radius);
        // 왼쪽 상단 모서리를 그립니다.
        ctx.arcTo(left, top, left + width, top, radius);
        // 경로를 닫습니다. (시작점과 끝점을 연결)
        ctx.closePath();
        // 현재 설정된 경로를 클리핑 영역으로 사용합니다. 이후 그리는 내용은 이 영역 내부에만 표시됩니다.
        ctx.clip();
    }

    // 렌더링 가능한 미디어 타입인지 검사
    function isDrawableItem(item) {
        return (
            // 아이템이 HTMLImageElement의 인스턴스이거나,
            item instanceof HTMLImageElement ||
            // 또는 아이템이 HTMLVideoElement의 인스턴스이면서 비디오의 너비와 높이가 0보다 큰 경우 (즉, 로드되어 실제 크기가 있는 경우)
            (item instanceof HTMLVideoElement &&
                item.videoWidth > 0 &&
                item.videoHeight > 0)
        );
    }

    // 갤러리의 한 칸(아이템)을 그리는 함수
    // item: 그릴 미디어 요소 (이미지 또는 비디오)
    // index: 아이템의 인덱스
    // scale: 아이템을 확대/축소할 배율 (기본값 1)
    function drawItem(item, index, scale = 1) {
        // 아이템이 그려질 그리드 상의 왼쪽 좌표를 계산합니다. (인덱스 % 열 수 * 아이템 너비)
        const left = (index % column) * itemWidth;
        // 아이템이 그려질 그리드 상의 위쪽 좌표를 계산합니다. (Math.trunc(인덱스 / 열 수) * 아이템 높이)
        const top = Math.trunc(index / column) * itemHeight;
        // 아이템 내부 여백을 고려한 실제 콘텐츠 너비를 계산합니다.
        const tempWidth = itemWidth - itemMargin * 2;
        // 아이템 내부 여백을 고려한 실제 콘텐츠 높이를 계산합니다.
        const tempHeight = itemHeight - itemMargin * 2;
        // 스케일(확대/축소)이 적용된 최종 목적지 너비를 계산합니다.
        const destWidth = tempWidth * scale;
        // 스케일(확대/축소)이 적용된 최종 목적지 높이를 계산합니다.
        const destHeight = tempHeight * scale;
        // 스케일 적용 후 아이템이 중앙에 위치하도록 최종 목적지 왼쪽 좌표를 계산합니다.
        const destLeft = left + itemMargin + (tempWidth - destWidth) / 2;
        // 스케일 적용 후 아이템이 중앙에 위치하고, 현재 스크롤 위치(scrollY)를 반영한 최종 목적지 위쪽 좌표를 계산합니다.
        const destTop = top + itemMargin + scrollY + (tempHeight - destHeight) / 2;

        // 현재 캔버스 드로잉 상태를 저장합니다. (클리핑 등의 설정을 복원하기 위함)
        ctx.save();
        drawClipPath(destLeft, destTop, destWidth, destHeight, 10); // 둥근 테두리 적용
        // 이미지를 캔버스에 그립니다.
        // isDrawableItem 함수를 통해 그릴 수 있는 아이템인지 확인하고, 아니면(오디오 파일 등) defaultAudioImg를 사용합니다.
        ctx.drawImage(
            isDrawableItem(item) ? item : defaultAudioImg,
            destLeft,
            destTop,
            destWidth,
            destHeight
        );
        // 이전에 저장했던 캔버스 드로잉 상태를 복원합니다. (클리핑 해제 등)
        ctx.restore();
    }

    // 원본 해상도 가져오기 (이미지 or 비디오)
    function getOrgSize(item) {
        // 아이템이 HTMLVideoElement의 인스턴스인 경우
        if (item instanceof HTMLVideoElement) {
            // 비디오의 videoWidth와 videoHeight를 반환합니다.
            return { width: item.videoWidth, height: item.videoHeight };
        } else { // 그 외의 경우 (HTMLImageElement 등)
            // 요소의 width와 height 속성을 반환합니다.
            return { width: item.width, height: item.height };
        }
    }

    // 선택된 아이템을 캔버스 전체에 확대하여 그리는 함수입니다.
    function drawSelectedItem(item) {
        // 만약 선택된 아이템이 오디오 시각화 객체에 연결된 렌더러(캔버스)를 가지고 있다면, 그 렌더러를 사용합니다.
        // 그렇지 않으면 원래 아이템(이미지/비디오)을 사용합니다.
        item = visualizerMap.get(item)?.renderer || item;
        // 선택된 아이템의 원본 너비와 높이를 가져옵니다.
        const { width, height } = getOrgSize(item);
        // 아이템의 가로세로 비율을 계산합니다.
        const imgAspectRatio = width / height;
        // 캔버스의 가로세로 비율을 계산합니다.
        const canvasAspectRatio = canvas.width / canvas.height;
        // 렌더링될 너비, 높이, 그리고 캔버스 내 x, y 오프셋을 저장할 변수를 선언합니다.

        // 아이템의 가로세로 비율이 캔버스의 가로세로 비율보다 큰 경우 (아이템이 캔버스보다 옆으로 넓은 경우)
        let renderWidth, renderHeight, offsetX, offsetY;
        if (imgAspectRatio > canvasAspectRatio) {
            renderWidth = canvas.width; // 렌더링 너비를 캔버스 너비에 맞춥니다.
            renderHeight = canvas.width / imgAspectRatio; // 비율에 맞게 렌더링 높이를 계산합니다.
            offsetX = 0; // x축 오프셋은 0입니다.
            offsetY = (canvas.height - renderHeight) / 2; // y축 오프셋은 캔버스 중앙에 위치하도록 계산합니다.
        } else { // 아이템의 가로세로 비율이 캔버스의 가로세로 비율보다 작거나 같은 경우 (아이템이 캔버스보다 위아래로 길거나 비율이 같은 경우)
            renderWidth = canvas.height * imgAspectRatio; // 비율에 맞게 렌더링 너비를 계산합니다.
            renderHeight = canvas.height; // 렌더링 높이를 캔버스 높이에 맞춥니다.
            offsetX = (canvas.width - renderWidth) / 2; // x축 오프셋은 캔버스 중앙에 위치하도록 계산합니다.
            offsetY = 0; // y축 오프셋은 0입니다.
        }
        // 현재 캔버스 드로잉 상태를 저장합니다.
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";   // 어두운 배경
        // 캔버스 전체를 반투명 검은색으로 채웁니다.
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // 계산된 위치와 크기로 선택된 아이템(또는 오디오 시각화 렌더러)을 그립니다.
        ctx.drawImage(item, offsetX, offsetY, renderWidth, renderHeight);
        // 이전에 저장했던 캔버스 드로잉 상태를 복원합니다.
        ctx.restore();
    }

    // 전체 캔버스 상태 다시 그리기 (모든 아이템 및 상태 업데이트)
    function drawCanvas() {
        ctx.fillStyle = "#fff";
        // 캔버스 전체를 흰색으로 다시 칠합니다. (이전 프레임 내용 지우기)
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // 모든 미디어 아이템(imageList)을 순회합니다.
        imageList.forEach((image, index) => {
            // 현재 순회하는 아이템이 마우스 호버된 아이템(hoverIndex)과 같다면, 일단 건너뜁니다. (호버 아이템은 나중에 그림)
            if (hoverIndex === index) return;
            // 호버되지 않은 아이템을 기본 크기로 그립니다.
            drawItem(image, index);
        });

        // hoverIndex가 null이 아니라면 (즉, 마우스가 어떤 아이템 위에 있다면)
        hoverIndex !== null &&
        // 해당 호버된 아이템을 현재 확대 배율(currentScale)로 다시 그립니다. (다른 아이템들 위에 그려짐)
        drawItem(imageList[hoverIndex], hoverIndex, currentScale);
        // selectedIndex가 null이 아니라면 (즉, 어떤 아이템이 선택되었다면)
        selectedIndex !== null && drawSelectedItem(imageList[hoverIndex]);
    }

    // 스크롤 가능한 최대 Y 위치를 계산하는 함수
    function calcMaxScrollPos(itemCount) {
        // 아이템 전체 개수와 한 행에 표시될 열(column) 수를 기준으로 필요한 총 행 수를 계산합니다. (올림 처리)
        const rowCount = Math.ceil(itemCount / column);
        // 모든 아이템을 표시하는 데 필요한 전체 높이를 계산합니다. (총 행 수 * 아이템 높이)
        const totalHeight = rowCount * itemHeight;
        // 스크롤 가능한 최대 Y 위치를 계산합니다. (전체 높이 - 캔버스 높이)
        // 스크롤은 아래로 내려갈수록 음수 값을 가지므로, 실제로는 이 값의 음수만큼 스크롤 가능합니다.
        maxScrollY = totalHeight - canvas.height;
    }

    // 캔버스에서 마우스 휠 이벤트가 발생했을 때 실행될 리스너를 추가합니다.
    canvas.addEventListener("wheel", (event) => {
        // 만약 어떤 아이템이 선택된 상태(selectedIndex !== null)라면, 스크롤 기능을 막습니다.
        if (selectedIndex !== null) return;

        // 브라우저의 기본 휠 동작(페이지 스크롤 등)을 막습니다.
        event.preventDefault();

        // console.log(event.deltaY);

        // scrollY 값을 휠 이동량(event.deltaY)만큼 변경합니다. (deltaY가 양수면 아래로 스크롤, 음수면 위로 스크롤)
        // scrollY는 위로 갈수록 양수, 아래로 갈수록 음수가 되므로, deltaY를 빼줍니다.
        scrollY -= event.deltaY;
        // scrollY 값이 0보다 커지지 않도록 제한합니다. (최상단 이상으로 스크롤 방지)
        scrollY = Math.min(scrollY, 0);
        // scrollY 값이 -maxScrollY (계산된 최대 스크롤 가능 위치의 음수값)보다 작아지지 않도록 제한합니다. (최하단 이하로 스크롤 방지)
        scrollY = Math.max(scrollY, -maxScrollY);
        // drawCanvas();
    });

    // 마우스 좌표 기준으로 아이템 index 계산
    function getItemIndex(x, y) {
        // x 좌표를 아이템 너비로 나누어 현재 마우스가 위치한 열의 인덱스를 계산합니다. (내림 처리)
        const columnIndex = Math.floor(x / itemWidth);
        // y 좌표를 아이템 높이로 나누어 현재 마우스가 위치한 행의 인덱스를 계산합니다. (내림 처리)
        const rowIndex = Math.floor(y / itemHeight);
        // 계산된 행과 열 인덱스를 사용하여 전체 아이템 리스트에서의 1차원 인덱스를 반환합니다.
        return rowIndex * column + columnIndex;
    }

    // 아이템 호버 시 확대/축소 애니메이션을 처리하는 함수입니다.
    // targetScale: 목표 확대 배율
    // duration: 애니메이션 지속 시간 (밀리초, 기본값 250ms = 0.25초)
    function animateScale(targetScale, duration = 250) {
        // 애니메이션 시작 시간을 기록합니다.
        const start = Date.now();
        // 애니메이션 시작 시점의 초기 배율을 1로 설정합니다. (항상 1에서 시작해서 targetScale로 변경)
        const initialScale = 1;
        // 초기 배율과 목표 배율 간의 차이를 계산합니다.
        const diff = targetScale - initialScale;

        // 애니메이션의 각 프레임을 처리하는 내부 함수입니다.
        function step() {
            // 애니메이션 시작 후 현재까지 경과된 시간을 계산합니다.
            const timePassed = Date.now() - start;
            // 전체 애니메이션 시간 대비 현재 경과 시간의 비율을 계산합니다. (0.0 ~ 1.0)
            const progress = timePassed / duration;
            // 현재 프레임에서의 확대 배율을 계산합니다. (초기 배율 + (변화량 * 진행률))
            currentScale = initialScale + diff * progress;
            // drawCanvas();
            // 애니메이션 진행률이 1 미만이면 (애니메이션이 아직 끝나지 않았으면)
            if (progress < 1) {
                // 다음 애니메이션 프레임을 요청합니다. (재귀 호출)
                requestAnimationFrame(step);
            }
        }
        // 애니메이션의 첫 번째 프레임을 시작합니다.
        step();
    }

    // 마우스 이동 시 hover 항목 갱신
    canvas.addEventListener("mousemove", (event) => {
        // console.log(event);
        // 만약 어떤 아이템이 선택된 상태(selectedIndex !== null)라면, 호버 효과를 처리하지 않습니다.
        if (selectedIndex !== null) return;
        // 현재 마우스 위치(event.offsetX, event.offsetY)와 스크롤 위치(scrollY)를 고려하여
        // 실제 아이템 그리드 상의 인덱스를 계산합니다.
        const newIndex = getItemIndex(event.offsetX, event.offsetY - scrollY);
        if (hoverIndex !== newIndex) {
            // hoverIndex를 새로운 인덱스로 업데이트합니다.
            hoverIndex = newIndex;
            // 호버된 아이템을 1.2배 확대하는 애니메이션을 시작합니다.
            animateScale(1.2);
            // drawCanvas();
        }
    });

    // 마우스 클릭으로 항목 선택 또는 닫기
    canvas.addEventListener("click", (event) => {
        // 만약 이미 어떤 아이템이 선택된 상태(selectedIndex !== null)라면 (즉, 확대된 이미지를 닫으려는 클릭)
        if (selectedIndex !== null) {
            // 이전에 선택되었던 아이템을 가져옵니다.
            const selectedItem = imageList[selectedIndex];
            // 해당 아이템에 대한 오디오 시각화 객체가 있는지 확인합니다.
            const visualizer = visualizerMap.get(selectedItem);
            // 시각화 객체가 있다면 재생을 일시 중지합니다.
            visualizer?.pause();

            // 선택된 아이템이 비디오 요소(<video>)인 경우
            if (selectedItem && selectedItem instanceof HTMLVideoElement) {
                // 비디오 재생을 일시 중지합니다.
                selectedItem.pause();
            }

            // 선택 상태를 해제합니다. (selectedIndex를 null로 설정)
            selectedIndex = null;
            // 호버 상태도 초기화합니다. (선택 해제 시 호버 효과도 없애기 위함
            hoverIndex = null;
            // drawCanvas();
        } else { // 어떤 아이템도 선택되지 않은 상태에서 클릭한 경우 (즉, 새로운 아이템을 선택하려는 클릭)
            // 클릭된 위치의 아이템 인덱스를 계산합니다. (스크롤 위치 고려)
            const newIndex = getItemIndex(event.offsetX, event.offsetY - scrollY);
            // 현재 선택된 아이템 인덱스(selectedIndex)와 새로 클릭된 아이템 인덱스(newIndex)가 다르면
            // (또는 처음 선택하는 경우 selectedIndex는 null이므로 항상 다름)
            if (selectedIndex !== newIndex) { // 사실상 항상 참이거나, 동일 아이템 재클릭 방지 목적
                // selectedIndex를 새로 클릭된 아이템의 인덱스로 업데이트합니다.
                selectedIndex = newIndex;
                // drawCanvas();
                // 새로 선택된 아이템 객체를 가져옵니다.
                const selectedItem = imageList[selectedIndex];

                // 선택된 아이템이 실제로 존재하는 경우
                if (selectedItem) {
                    // 선택된 아이템이 캔버스에 직접 그릴 수 없는 아이템인 경우 (즉, 오디오 파일인 경우)
                    if (!isDrawableItem(selectedItem)) {
                        // visualizerMap에서 해당 오디오 아이템에 대한 시각화 객체를 가져옵니다.
                        let visualizer = visualizerMap.get(selectedItem);
                        // 만약 시각화 객체가 아직 없다면 (처음 선택된 오디오 파일이라면)
                        if (!visualizer) {
                            // getVisualizer 유틸리티 함수를 사용하여 새로운 시각화 객체를 생성합니다. (캔버스 크기 640x320)
                            visualizer = getVisualizer(selectedItem, 640, 320);
                            // 생성된 시각화 객체를 visualizerMap에 저장하여 재사용할 수 있도록 합니다.
                            visualizerMap.set(selectedItem, visualizer);
                        }
                        // 오디오 시각화 재생을 시작합니다.
                        visualizer.play();
                    }
                    // 선택된 아이템이 비디오 요소(<video>)인 경우
                    if (selectedItem instanceof HTMLVideoElement) {
                        // 비디오 소리가 나도록 음소거를 해제합니다.
                        selectedItem.muted = false;
                        // 비디오가 끝나면 자동으로 다시 재생되도록 반복 재생(loop)을 활성화합니다.
                        selectedItem.loop = true;
                        // 비디오 재생을 시작합니다. (또는 이어합니다)
                        selectedItem.play();
                    }
                }
            }
        }
    });

    // 렌더링 루프 시작 (FPS 제한 없이)
    function startRender() {
        // 다음 애니메이션 프레임에 startRender 함수 자체를 다시 호출하도록 예약합니다.
        requestAnimationFrame(startRender);
        // 캔버스의 현재 상태를 기반으로 모든 내용을 다시 그립니다.
        drawCanvas();
    }
    // 렌더링 루프를 최초로 시작합니다.
    startRender();

    return canvas; // 모든 설정과 이벤트 리스너가 추가된 최종 캔버스 요소를 반환합니다.
}