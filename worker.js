// imageReplacer.js - simplified to use only the custom URL list saved in options

let enableImgReplace = false;
let imgReplaceProb = 0;
let imgLib = [];
let numImages = 0;

async function init() {
    try {
        const data = await new Promise((resolve) => {
            chrome.storage.sync.get(["settings"], function (data) {
                resolve(data);
            });
        });
        const settings = (data && data.settings && data.settings.imageReplacement) ? data.settings.imageReplacement : null;
        if (settings) {
            enableImgReplace = !!settings.enableImgReplace;
            imgReplaceProb = typeof settings.imgReplaceProb === "number" ? settings.imgReplaceProb : 0;
            imgLib = Array.isArray(settings.customImageLibrary) ? settings.customImageLibrary : [];
        } else {
            enableImgReplace = false;
            imgReplaceProb = 0;
            imgLib = [];
        }
    } catch (e) {
        console.error("Failed to read settings:", e);
        enableImgReplace = false;
        imgReplaceProb = 0;
        imgLib = [];
    }

    if (enableImgReplace && imgLib.length > 0) {
        main();
        setInterval(main, 3000);
    }
}

init();

function main() {
    const allImages = document.images;
    for (let i = numImages; i < allImages.length; i++) {
        if (shouldReplaceImg()) {
            replaceImage(allImages[i]);
        }
    }
    numImages = allImages.length;
}

function replaceImage(image) {
    if (!Array.isArray(imgLib) || imgLib.length === 0) return;

    const newSrc = getRandomImage();
    if (!newSrc) return;

    // preserve original size & fit replacement
    image.setAttribute("style", `height:${image.height}px; width:${image.width}px; object-fit:cover; object-position:50% 35%; content:url(${newSrc});`);
    image.src = newSrc;
}

function getRandomImage() {
    if (!Array.isArray(imgLib) || imgLib.length === 0) return null;
    const randIndex = Math.floor(Math.random() * imgLib.length);
    return imgLib[randIndex];
}

function shouldReplaceImg() {
    const rand = Math.random();
    return rand <= imgReplaceProb;
}
