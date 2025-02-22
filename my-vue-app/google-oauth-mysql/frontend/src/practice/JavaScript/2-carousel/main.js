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

const itemContainer = createElement({
  tagName: "div",
  parent: wrapper,
});
itemContainer.style.cssText = `display: flex;
transform = translateX(-700px);`;

addButtons();

addImageItem(wrapper, "./images/02.jpg");

function handleSlide(next = true) {
  itemContainer.style.transitionDuration = "0.5s";
  itemContainer.style.transform = `translateX(${next ? -1400 : 0}px)`;

  itemContainer.ontransitionend = () => {
    itemContainer.style.removeProperty("transition-duration");
    itemContainer.style.transform = "translateX(-700px)";

    next
      ? itemContainer.appendChild(itemContainer.firstChild)
      : itemContainer.prepend(itemContainer.lastChild);
  };
}

function addButtons() {
  // 3. 이전 및 다음 버튼 생성
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

  nextButton.onlick = () => {
    handleSlide();
  };

  prevButton.onlick = () => {
    handleSlide(false);
  };
}

function addImageItem(parent, src, captionText = "Caption") {
  // 4. 이미지와 캡션을 포함하는 컨테이너 생성
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

  // 5. 이미지 요소 생성
  const image = createElement({
    tagName: "img",
    parent: container,
    properties: { src }, // 이미지 경로 지정
  });
  image.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover; /* 이미지 비율 유지하면서 꽉 차게 표시 */
  `;

  // 6. 이미지 위에 표시되는 캡션(span 요소) 생성
  const caption = createElement({
    tagName: "span",
    properties: { innerText: Caption },
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
// 7. createElement 함수 정의
function createElement({
  tagName,
  properties = {},
  parent,
  children,
  count = 1,
}) {
  /**
   * 1. 새로운 HTML 요소(tagName으로 지정)를 생성한다.
   * 2. properties 객체에 포함된 속성을 요소에 할당한다.
   * 3. parent가 지정되어 있으면 해당 요소를 부모에 추가한다.
   * 4. children이 지정되면 해당 자식 요소들을 재귀적으로 생성한다.
   * 5. count가 1보다 크면 해당 개수만큼 요소를 배열로 반환한다.
   */
  const create = () => {
    const element = document.createElement(tagName);
    Object.assign(element, properties); // 객체 속성을 요소에 적용
    if (parent) parent.appendChild(element); // 부모 요소에 추가
    if (children) {
      children.forEach((child) => {
        child.parent = element; // 자식의 부모를 현재 요소로 설정
        createElement(child); // 재귀적으로 자식 요소 생성
      });
    }
    return element; // 생성한 요소 반환
  };

  if (count > 1) {
    return Array.from({ length: count }, create); // 배열로 반환
  } else {
    return create(); // 단일 요소 반환
  }
}
