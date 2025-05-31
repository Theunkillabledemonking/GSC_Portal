export default function gallery(imageSrcList, width, height, row, column) {
    console.log('gallery');
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    const itemWidth = canvas.width / column;
    const itemHeight = canvas.height / row;
    const itemMargin = 2;


    const imageList = imageSrcList.map((src, index) => {
        const image = document.createElement('img');
        image.src = src;
        image.onload = () => {
            drawItem(image, index);
        }
        return image;
    });

    function drawClipPath(left, top, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(left + radius, top);
        ctx.arcTo(left + width, top, left + width, top + height, radius);
        ctx.arcTo(left + width, top + height, left, top + height, radius);
        ctx.arcTo(left, top, left + width, top + height, radius);
        ctx.arcTo(left, top + height, left + width, top + height, radius);
        ctx.closePath();
        ctx.clip();

    }

    function drawItem(item, index) {
        const left = (index % column) * itemWidth
        const top = Math.trunc(index / column) * itemHeight;
        const destLeft = left + itemMargin;
        const destTop = top + itemMargin;
        const destWidth = itemWidth - itemMargin * 2;
        const destHeight = itemHeight - itemMargin * 2;

        ctx.drawImage(item, destLeft, destTop, destWidth, destHeight);
    }

    return canvas;
}