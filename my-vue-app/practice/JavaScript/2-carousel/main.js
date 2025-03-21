console.log("loaded!");

// 1. 메인 컨테이너 생성
const app = createElement({
  tagName: "div",
  parent: document.body,
});

// 스타일 적용 (회색 배경 박스)
app.style.cssText = `
    width: 700px;
    height: 250px;
    background-color: rgb(100, 100, 100);
    position: relative;
    overflow: hidden;
`;

// 2. 버튼과 이미지 컨테이너를 감싸는 wrapper 생성
const wrapper = createElement({
  tagName: "div",
  parent: app,
});
wrapper.style.cssText = `
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    overflow: hidden;
`;

// 3. 이미지들을 담을 itemContainer 생성
const itemContainer = createElement({
  tagName: "div",
  parent: wrapper,
});
itemContainer.style.cssText = `
    display: flex;
    transform: translateX(-700px);  /* 시작 위치 (두 번째 이미지부터 표시) */
    transition: transform 0.5s ease;  /* 부드러운 슬라이드 효과 */
`;

// 4. 이미지 추가
// 이미지 배열 (필요에 따라 더 추가 가능)
const imageSources = ["./images/01.jpg", "./images/02.jpg", "./images/03.jpg"];

// 이미지 추가 (앞, 중간, 끝 순으로 추가해 무한 루프처럼 보이게 함)
addImageItem(
  itemContainer,
  imageSources[imageSources.length - 1],
  "Last Image"
); // 마지막 이미지 (앞으로 보임)
imageSources.forEach((src, index) =>
  addImageItem(itemContainer, src, `Image ${index + 1}`)
); // 중간 이미지들
addImageItem(itemContainer, imageSources[0], "First Image"); // 첫 번째 이미지 (끝에 추가)

// 이미지 개수에 맞게 itemContainer의 너비를 설정
itemContainer.style.width = `${700 * (imageSources.length + 2)}px`;

// 5. 이전/다음 버튼 추가
addButtons();

/**
 * ✅ handleSlide 함수
 * - 이미지 슬라이드를 처리하는 함수
 * - next가 true면 오른쪽에서 왼쪽으로 이동
 * - false면 왼쪽에서 오른쪽으로 이동
 */
function handleSlide(next = true) {
  itemContainer.style.transitionDuration = "0.5s"; // 전환 시간 설정
  itemContainer.style.transform = `translateX(${next ? -1400 : 0}px)`; // 다음 이미지로 슬라이드

  // 애니메이션 종료 시 이미지 순서를 재정렬
  itemContainer.ontransitionend = () => {
    itemContainer.style.removeProperty("transition-duration"); // 전환 시간 제거 (순간 이동처럼 보이기 위해)
    itemContainer.style.transform = "translateX(-700px)"; // 중앙 위치로 초기화

    if (next) {
      // 첫 번째 이미지를 맨 끝으로 이동 (오른쪽으로 슬라이드 시)
      itemContainer.appendChild(itemContainer.firstElementChild);
    } else {
      // 마지막 이미지를 맨 앞으로 이동 (왼쪽으로 슬라이드 시)
      itemContainer.prepend(itemContainer.lastElementChild);
    }
  };
}

/**
 * ✅ addButtons 함수
 * - 이전 및 다음 버튼을 생성하고 클릭 시 handleSlide 호출
 */
function addButtons() {
  const [prevButton, nextButton] = createElement({
    tagName: "button",
    parent: wrapper,
    count: 2,
  });

  // 공통 버튼 스타일
  prevButton.style.cssText = nextButton.style.cssText = `
        position: absolute;
        z-index: 1;
        border: 0;
        top: 0;
        width: 50px;
        height: 100%;
        background-color: transparent;
        color: white;
        font-size: 20px;
        cursor: pointer;
        border: none;
    `;

  // 각 버튼 위치와 배경 스타일
  prevButton.style.left = "0";
  prevButton.style.background = `
        linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.3) 100%)
    `;
  nextButton.style.right = "0";
  nextButton.style.background = `
        linear-gradient(270deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.3) 100%)
    `;

  // 버튼 아이콘 추가
  prevButton.innerHTML = "❮"; // 이전 버튼 화살표
  nextButton.innerHTML = "❯"; // 다음 버튼 화살표

  // 버튼 클릭 시 handleSlide 호출
  nextButton.onclick = () => handleSlide(true); // 다음 이미지로 이동
  prevButton.onclick = () => handleSlide(false); // 이전 이미지로 이동
}

/**
 * ✅ addImageItem 함수
 * - 이미지를 itemContainer에 추가
 * - 이미지와 캡션을 포함한 div를 생성
 */
function addImageItem(parent, src, captionText = "Caption") {
  const container = createElement({
    tagName: "div",
    parent,
  });
  container.style.cssText = `
        width: 700px;
        height: 250px;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        position: relative;
    `;

  const image = createElement({
    tagName: "img",
    parent: container,
    properties: { src },
  });
  image.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover; 
    `;

  const caption = createElement({
    tagName: "span",
    properties: { innerText: captionText },
    parent: container,
  });
  caption.style.cssText = `
        color: white;
        font-weight: bold;
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        filter: drop-shadow(3px 3px 3px rgba(0, 0, 0, 0.5));
    `;

  return container;
}

/**
 * ✅ createElement 함수
 * - HTML 요소를 동적으로 생성하는 재사용 가능한 함수
 * - tagName: 생성할 태그명 (div, img, button 등)
 * - properties: 요소에 추가할 속성 (src, innerText 등)
 * - parent: 부모 요소 (요소를 추가할 위치)
 * - children: 자식 요소 배열 (재귀적으로 추가됨)
 * - count: 요소를 몇 개 생성할지 (기본값은 1)
 */
function createElement({
  tagName,
  properties = {},
  parent,
  children,
  count = 1,
}) {
  const create = () => {
    const element = document.createElement(tagName);
    Object.assign(element, properties);
    if (parent) parent.appendChild(element);
    if (children) {
      children.forEach((child) => {
        child.parent = element;
        createElement(child);
      });
    }
    return element;
  };

  return count > 1 ? Array.from({ length: count }, create) : create();
}
