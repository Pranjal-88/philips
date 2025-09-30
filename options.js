// options.js - simplified to use only custom URL list

let curSessionCustomImages = [];
let testImgSrcIndex = -1;
const TEST_IMAGE_REF = "/images/replacementTester.jpg";

const DEFAULT_SETTINGS = {
    enableImgReplace: false,
    imgReplaceProb: 0.01,
    imgLibraryName: "custom",
    customImageLibrary: [],
    incrementValue: 0,
    incrementInterval: "3600000",
    messageForVictim: "",
    lastUpdate: 0
};

function safeGetSettingsFromStorage() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["settings"], function (data) {
            const settingsObj = (data && data.settings && data.settings.imageReplacement) ? data.settings.imageReplacement : DEFAULT_SETTINGS;
            resolve(settingsObj);
        });
    });
}

async function saveImageOptions() {
    // get current settings (safe)
    let settingsToSave = await safeGetSettingsFromStorage();

    // update settings from UI
    settingsToSave.enableImgReplace = document.getElementById('enableImageReplacement').checked;
    settingsToSave.imgReplaceProb = Number(document.getElementById('imgReplaceProb').value) / 100;
    settingsToSave.imgLibraryName = "custom";
    settingsToSave.incrementValue = Number(document.getElementById('incrementValue').value) / 100;
    settingsToSave.incrementInterval = document.getElementById('incrementInterval').value;
    settingsToSave.messageForVictim = document.getElementById('ncMessageInput').value || "";
    settingsToSave.lastUpdate = new Date().getTime();
    settingsToSave.customImageLibrary = curSessionCustomImages;

    chrome.storage.sync.set({
        settings: {
            imageReplacement: settingsToSave
        }
    }, function () {
        const status = document.getElementById('ncStatus');
        status.textContent = 'Options saved!';
        setTimeout(() => status.textContent = '', 3000);
    });
}

function parseTextarea() {
    const content = document.getElementById("ncTextareaContent").value || "";
    // remove newlines, split by comma
    const urlCandidates = content.replace(/\n/g, ",").split(',').map(s => s.trim()).filter(Boolean);

    const urlRegex = /^(https?:\/\/)([^\s/$.?#].[^\s]*)$/i;
    curSessionCustomImages = urlCandidates.filter(u => urlRegex.test(u));

    const notice = document.getElementById("ncTextAreaNotice");
    notice.style.color = curSessionCustomImages.length > 0 ? "green" : "red";
    notice.textContent = `${curSessionCustomImages.length} valid url(s) extracted.`;

    if (curSessionCustomImages.length > 0) {
        testImgSrcIndex = Math.max(0, curSessionCustomImages.length - 1);
        updateTestImage(curSessionCustomImages[testImgSrcIndex]);
    } else {
        testImgSrcIndex = -1;
        updateTestImage(TEST_IMAGE_REF);
    }
    updateImageControls();
}

function updateTestImage(newSrc) {
    const testImage = document.getElementById("ncTestImg");
    // use onerror to fallback if image can't be loaded
    testImage.onerror = () => {
        testImage.setAttribute("src", TEST_IMAGE_REF);
    };
    testImage.setAttribute("style", `height:${testImage.height}px; width:${testImage.width}px; object-fit:cover; object-position:50% 35%;`);
    testImage.src = newSrc;
}

function showNextTestImage() {
    if (curSessionCustomImages.length === 0) return;
    testImgSrcIndex = (testImgSrcIndex + 1) % curSessionCustomImages.length;
    updateTestImage(curSessionCustomImages[testImgSrcIndex]);
    updateImageControls();
}

function showPrevTestImage() {
    if (curSessionCustomImages.length === 0) return;
    testImgSrcIndex = (testImgSrcIndex - 1 + curSessionCustomImages.length) % curSessionCustomImages.length;
    updateTestImage(curSessionCustomImages[testImgSrcIndex]);
    updateImageControls();
}

function updateImageControls() {
    document.getElementById("ncCurIndex").textContent = curSessionCustomImages.length ? (testImgSrcIndex + 1) : 0;
    document.getElementById("ncSrcListLength").textContent = curSessionCustomImages.length;
}

async function restoreOptions() {
    const curSettings = await safeGetSettingsFromStorage();

    document.getElementById("enableImageReplacement").checked = !!curSettings.enableImgReplace;
    const replacementRate = (typeof curSettings.imgReplaceProb === "number") ? curSettings.imgReplaceProb : DEFAULT_SETTINGS.imgReplaceProb;
    document.getElementById("imgReplaceProb").value = +(replacementRate * 100).toFixed(4);

    curSessionCustomImages = Array.isArray(curSettings.customImageLibrary) ? curSettings.customImageLibrary.slice() : [];
    document.getElementById("incrementValue").value = (curSettings.incrementValue || 0) * 100;
    document.getElementById("incrementInterval").value = curSettings.incrementInterval || DEFAULT_SETTINGS.incrementInterval;
    document.getElementById('ncMessageInput').value = curSettings.messageForVictim || "";

    // populate textarea
    populateTextArea(curSessionCustomImages);

    if (curSessionCustomImages.length > 0) {
        testImgSrcIndex = curSessionCustomImages.length - 1;
        updateTestImage(curSessionCustomImages[testImgSrcIndex]);
    } else {
        updateTestImage(TEST_IMAGE_REF);
    }
    updateImageControls();

    // show message once if present
    if (curSettings.messageForVictim) {
        alert(`You've been pranked! The perpetrator has left you the following message:\n${curSettings.messageForVictim}`);
    }
}

function populateTextArea(urlList) {
    const text = (urlList || []).map(u => u).join(",\n");
    document.getElementById("ncTextareaContent").value = text;
}

function closeTab() {
    window.close();
}

// event wiring
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveImageOptions').addEventListener('click', saveImageOptions);
document.getElementById('ncCloseTabButton').addEventListener('click', closeTab);
document.getElementById('ncTextareaContent').addEventListener('input', parseTextarea);
document.getElementById('ncNextImage').addEventListener('click', showNextTestImage);
document.getElementById('ncPrevImage').addEventListener('click', showPrevTestImage);
