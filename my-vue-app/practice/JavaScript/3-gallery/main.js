// gallery.js 모듈에서 기본 gallery 함수를 import
import gallery from "./gallery.js";


// 갤러리를 담을 부모 div 요소 생성
const parent = document.createElement("div");
document.body.appendChild(parent); // <body>에 div 추가

// 부모 div의 크기 설정 (정사각형 640X640)
parent.style.width = "640px";
parent.style.height = "640px";

// 이미지, 오디오, 비디오, 파일 경로 리스트 정의
// - 다양한 포맷(mp4, mp3, jpg)이 혼합
// - gallery.js 내부에서 파일 확장자별로 분기 처리하여 적절한 요소 생성
const imageSrcList = [
    "./videos/01.mp4",
    "./audio/01.mp3",
    "./audio/02.mp3",
    "./audio/03.mp3",
    "./images/04.jpg",
    "./images/05.jpg",
    "./images/06.jpg",
    "./images/07.jpg",
    "./images/08.jpg",
    "./images/09.jpg",
    "./images/10.jpg",
    "./images/11.jpg",
    "./images/12.jpg",
    "./images/13.jpg",
    "./images/14.jpg",
    "./images/15.jpg",
    "./images/01.jpg",
    "./images/02.jpg",
    "./images/03.jpg",
    "./images/04.jpg",
    "./images/05.jpg",
    "./images/01.jpg",
    "./images/02.jpg",
    "./images/03.jpg",
    "./images/04.jpg",
    "./images/05.jpg",
    "./images/06.jpg",
    "./images/07.jpg",
    "./images/08.jpg",
    "./images/09.jpg",
    "./images/10.jpg",
    "./images/11.jpg",
    "./images/12.jpg",
    "./images/13.jpg",
    "./images/14.jpg",
    "./images/15.jpg",
    "./images/01.jpg",
    "./images/02.jpg",
    "./images/03.jpg",
    "./images/04.jpg",
    "./images/05.jpg",
    "./images/06.jpg",
];

// gallery() 함수 실행
// - (리스트, 가로, 세로, 행 수, 열 수)
// - 640x640 canvas 안에 4행 5열 = 총 20칸 기준으로 미디어 항목 배치
parent.appendChild(gallery(imageSrcList, 640, 640, 4, 5));
