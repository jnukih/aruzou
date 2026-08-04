// あるぞう Service Worker
// 自分自身のファイル一式をキャッシュし、cache-firstで返す(オフラインでも開ける)。
// 更新を配布したい時はここのバージョンを上げる(例: 'aruzou-v2')だけでよい。
var CACHE = "aruzou-v18";
// jnukih.github.io は複数アプリを配信していてCache Storageはオリジン共通なので、
// activateで削除するのは自分(あるぞう)のキャッシュだけに限定する
var CACHE_PREFIX = "aruzou-";

var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-180-v3.png",
  "./icon-512-v3.png",
  "./char-normal.png",
  "./char-worried.png",
  "./char-joy.png",
  "./char-thinking.png",
  "./sw.js",
];
// icon-180.png / icon-180-v2.png はv0.7.0でicon-180-v3.pngに置き換え、コード上どこからも
// 参照しなくなったためASSETSから外した(icon-180.pngはそれ以前から既に未参照だった)。
// 残しても cache.addAll 自体は失敗しない(ファイルは実在する)が、参照されない画像を
// 際限なく積み増さないため、使われなくなった時点で外す運用にする。
// 旧キャッシュ("aruzou-v14"等)はactivateでCACHE_PREFIX一致・現行CACHE不一致のものを
// 削除するので、古いバージョン名で入っていたicon-180-v2.pngのキャッシュも自動的に消える。

self.addEventListener("install", function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(event){
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function(cached){
      if (cached) return cached;
      return fetch(event.request).then(function(res){
        return res;
      }).catch(function(){
        // オフラインでキャッシュにも無い場合、ナビゲーションならトップページで代替
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
