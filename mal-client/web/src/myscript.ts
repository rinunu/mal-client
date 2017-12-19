import * as $ from "jquery";
import * as webkit from "webkit";
import * as config from "config";

const ANIME_DETAIL_URL_RE = /\/anime\/(\d+)/;

/**
 * url から animeId を抽出する
 *
 * @param {string} url
 * @returns {number}
 */
function getAnimeId(url: string): number {
    const m = ANIME_DETAIL_URL_RE.exec(url);
    if (!m) {
        throw `invalid url: ${url}`;
    }
    return parseInt(m[1]);
}

/**
 * 指定した parentElem に dアニメストアのアイコンを付ける
 *
 * @param {HTMLElement} parentElem
 * @param {number} animeId
 * @returns {Promise<void>}
 */
async function addDAnimeIcon(parentElem: HTMLElement, animeId: number) {
    prependDAnimeIconElem(parentElem);
    console.log("anime detail", animeId);
    try {
        const dAnimeId = await getDAnimeId(animeId);
        if (dAnimeId) {
            enableDAnimeIcon(parentElem, dAnimeId);
        } else {
            disableDAnimeIcon(parentElem);
            console.log("No such document!");
        }
    } catch (e) {
        disableDAnimeIcon(parentElem);
        console.log("Error getting document:", e);
    }
}

/**
 * 一覧ページのまだ処理していない要素の状態を更新する
 *
 * 状態を更新するとは
 * - dアニメストアのアイコンを付ける
 *
 * 一度処理した要素は二度と処理しないので、何度呼び出しても良い。
 */
async function updateItemStatusInListPage() {
    console.log("check new items");
    const $tiles = $(".tile-unit:not(.mc-done)");
    if ($tiles.length === 0) {
        return;
    }

    const animeIdPromises: Promise<any>[] = [];
    console.log('tiles', $tiles);
    $tiles.each((i, itemRootElem) => {
        $(itemRootElem).addClass("mc-done");
        const $a = $(itemRootElem).find("a");
        const iconElem = $(`<div class="mc-list-icon"></div>`).appendTo(itemRootElem)[0];
        const url = <string>$a.attr("href");
        const promise = addDAnimeIcon(iconElem, getAnimeId(url));
        animeIdPromises.push(promise);
    });

    await Promise.all(animeIdPromises);
    console.log('loaded all');
}

/**
 * 指定時間後に timeout する Promise
 *
 * @param {number} ms
 * @returns {Promise<void>}
 */
function timeout(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

async function onUserAnimeListPage() {
    async function loop() {
        while (true) {
            await updateItemStatusInListPage();
            await timeout(1000);
        }
    }

    await loop();
}

/**
 * ページに指定した script を読み込む
 *
 * @param {string} srcUrl
 * @returns {Promise<any>}
 */
async function addScript(srcUrl: string) {
    const script = document.createElement('script');
    script.src = srcUrl;
    document.body.appendChild(script);

    return new Promise((resolve) => {
        script.onload = () => {
            console.log('script loaded', srcUrl);
            resolve()
        }
    });
}

/**
 * firebase を初期化する
 */
async function addFirebase() {
    await Promise.all([
        addScript("https://www.gstatic.com/firebasejs/4.6.0/firebase.js"),
        addScript("https://www.gstatic.com/firebasejs/4.6.0/firebase-firestore.js")]);

    firebase.initializeApp(config.firebase);
}

function prependDAnimeIconElem(parent: HTMLElement) {
    const $icon = $(
        `<a class="mc-d-anime-icon">
         </a>`);
    $icon.prependTo(parent);
}

function enableDAnimeIcon(parentElem: HTMLElement, dAnimeId: number) {
    console.log("add d anime info ", dAnimeId);
    $(parentElem)
        .find(".mc-d-anime-icon")
        .removeClass("mc-d-anime-icon--disabled")
        .addClass("mc-d-anime-icon--enabled")
        .attr("href", `https://anime.dmkt-sp.jp/animestore/ci_pc?workId=${dAnimeId}`);
}

function disableDAnimeIcon(parentElem: HTMLElement) {
    $(parentElem).find(".mc-d-anime-icon")
        .addClass("mc-d-anime-icon--disabled");
}

function getFirestoreCollection() {
    const db = firebase.firestore();
    return db.collection("mal_client_mal_to_danime");
}

async function getDAnimeId(malAnimeId: number): Promise<number | null> {
    console.log(`get d-anime id: ${malAnimeId}`);
    const doc = await getFirestoreCollection().doc(`${malAnimeId}`).get();
    if (doc.exists) {
        return doc.data()["danime_anime_id"];
    } else {
        return null;
    }
}

async function onAnimeDetailPage(animeId: number) {
    const parentElem = $('.status-unit')[0];
    await addDAnimeIcon(parentElem, animeId);
}

async function onLoad() {
    await addFirebase();

    {
        let m = ANIME_DETAIL_URL_RE.exec(location.pathname);
        if (m) {
            return await onAnimeDetailPage(getAnimeId(location.pathname));
        }
    }

    {
        let m = /^\/animelist\//.exec(location.pathname);
        if (m) {
            return onUserAnimeListPage();
        }
    }
}

onLoad();

