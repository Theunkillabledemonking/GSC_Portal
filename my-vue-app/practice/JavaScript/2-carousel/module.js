// 캐러셀 컴포넌트 로드 확인용 로그
console.log("load carousel");

// makeCarousel: 슬라이드형 이미지 캐러셀 생성 함수
export default function makeCarousel(itemList, options) {
    // 옵션 병합: 기본값 설정
    const { visibleCount, slideCount, captionPos } = Object.assign(
        { visibleCount: 1, slideCount: 1, captionPos: "center middle" },
        options
    );

    // 오른쪽 화살표 아이콘 (SVG)
    const iconNext = `<svg xmlns=...></svg>`;

    // 왼쪽 화살표 아이콘 (SVG)
    const iconPrev = `<svg xmlns=...></svg>`;

    // 이미지 1장의 너비 계산 (총 700px 기준)
    const itemWidth = Math.trunc(700 / visibleCount);

    // 캐러셀 전체 wrapper 생성
    const wrapper = createElement({ tagName: "div" });
    wrapper.style.cssText = `
        width: 100%;
        height: 100%;
        position: relative;     /* 버튼 배치 기준 */
        display: flex;
        overflow: hidden;       /* 슬라이드 넘어가는 부분 숨김 */
    `;

    // 실제 슬라이드 이미지들이 담기는 컨테이너
    const itemContainer = createElement({
        tagName: "div",
        parent: wrapper,
    });
    itemContainer.style.cssText = `
        display: flex;
        transform: translateX(0px); /* 초기 위치 설정 */
        align-items: center;        /* 수직 정렬 */
    `;

    // 좌우 버튼 추가 및 이벤트 연결
    addButtons();

    // itemList가 존재하면 동적으로 이미지 추가
    if (itemList) {
        itemList.forEach((item) => {
            addImageItem(itemContainer, item);
        });
    } else {
        // 기본 이미지 세트
        addImageItem(itemContainer, "./images/02.jpg");
        addImageItem(itemContainer, "./images/03.jpg");
        addImageItem(itemContainer, "./images/04.jpg");
        addImageItem(itemContainer, "./images/05.jpg");
    }

    // 버튼 클릭 시 슬라이드 처리
    function handleSlide(next = true) {
        // slideCount만큼 복제하여 추가
        for (let i = 0; i < slideCount; ++i) {
            const index = i & itemContainer.children.length;
            if (next) {
                // 오른쪽 → 앞에서 복제해서 뒤에 붙임
                itemContainer.appendChild(
                    itemContainer.children[index].cloneNode(true)
                );
            } else {
                // 왼쪽 → 뒤에서 복제해서 앞에 붙임
                itemContainer.prepend(
                    itemContainer.children[
                    itemContainer.children.length - index - 1
                        ].cloneNode(true)
                );
            }
        }

        // 왼쪽 이동 시에는 미리 한 칸 왼쪽으로 당겨야 자연스러움
        if (!next) {
            itemContainer.style.transform = `translateX(${ -itemWidth * slideCount }px)`;
        }

        // 트랜지션 실행
        setTimeout(() => {
            handleTransitionEnd(next);
        }, 0);
    }

    // 트랜지션 종료 후 DOM 정리
    function handleTransitionEnd(next) {
        itemContainer.style.transitionDuration = "0.5s"; // 슬라이드 시간 설정
        itemContainer.style.transform = `translateX(${ next ? -itemWidth * slideCount : 0 }px)`;

        // 애니메이션 끝나면 복제했던 요소 삭제 + 위치 초기화
        itemContainer.ontransitionend = () => {
            for (let i = 0; i < slideCount; ++i) {
                next
                    ? itemContainer.firstChild.remove()
                    : itemContainer.lastChild.remove();
            }
            itemContainer.style.removeProperty("transition-duration");
            itemContainer.style.transform = `translateX(0px)`;
        };
    }

    // 좌우 버튼 추가 및 이벤트 처리
    function addButtons() {
        const [prevButton, nextButton] = createElement({
            tagName: "button",
            parent: wrapper,
            count: 2,
        });

        // 버튼 기본 스타일
        prevButton.style.cssText = `
            position: absolute;
            z-index: 1;
            border: 0;
            top: 0;
            width: 50px;
            height: 100%;
            background-color: transparent;
            background: linear-gradient(90deg, rgba(0,0,0,0.3), rgba(0,0,0,0.1), rgba(0,0,0,0));
            filter: drop-shadow(3px 5px 2px rgb(0 0 0 / 0.7));
        `;
        nextButton.style.cssText = prevButton.style.cssText;

        // 오른쪽 버튼은 반대 방향 그라데이션
        nextButton.style.background =
            "linear-gradient(270deg, rgba(0,0,0,0.3), rgba(0,0,0,0.1), rgba(0,0,0,0))";

        // 위치 조정
        prevButton.style.left = "0px";
        nextButton.style.right = "0px";

        // 아이콘 삽입
        prevButton.innerHTML = iconPrev;
        nextButton.innerHTML = iconNext;

        // 버튼 이벤트 연결
        nextButton.onclick = () => handleSlide();
        prevButton.onclick = () => handleSlide(false);
    }

    // 이미지 + 캡션 생성 및 추가
    function addImageItem(parent, src, captionText = "Caption text") {
        const container = createElement({ tagName: "div", parent });
        container.style.cssText = `
            width: ${itemWidth}px;
            height: 250px;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            background-color: #000;
            position: relative;
        `;

        // 이미지 생성
        const image = createElement({
            tagName: "img",
            parent: container,
            properties: { src },
        });
        image.style.cssText = `height: 100%;`;

        // 캡션 생성
        const caption = createElement({
            tagName: "span",
            properties: { innerText: captionText },
            parent: container,
        });
        caption.style.cssText = `
            color: white;
            font-weight: bold;
            position: absolute;
            filter: drop-shadow(3px 3px 3px rgb(0 0 0 / 0.5));
        `;

        // 캡션 위치 설정
        if (captionPos.includes("left")) {
            caption.style.left = "10%";
        } else if (captionPos.includes("right")) {
            caption.style.right = "10%";
        }
        if (captionPos.includes("top")) {
            caption.style.top = "20%";
        } else if (captionPos.includes("bottom")) {
            caption.style.bottom = "20%";
        }

        return container;
    }

    // 캐러셀 DOM 반환
    return wrapper;
}

export function createElement({ tagName, properties, parent, children, count = 1 }) {
    const create = () => {
        const element = document.createElement(tagName);      // HTML 태그 생성
        Object.assign(element, properties);                   // 속성 주입 (id, innerText 등)
        parent?.appendChild(element);                         // 부모에 부착
        children?.map((child) => {                            // 자식 요소도 재귀 생성
            child.parent = element;
            createElement(child);
        });
        return element;
    };

    // 여러 개 만들 경우 배열로 반환
    return count > 1
        ? Array.from({ length: count }, () => create())
        : create();
}
