import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    RotateCcw,
    Check,
    Settings,
    Eye,
    EyeOff,
    Sword,
    X,
    Minus,
    GripVertical,
    Sun,
    Moon,
    Type,
    FileEdit,
    Save,
    Upload,
    Download,
    Undo2,
    Image as ImageIcon,
    ImagePlus,
    Search,
    Plus,
    Trash2,
    Copy,
    Keyboard,
    Timer,
    ListChecks,
    FolderOpen,
    Eraser
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

import { CheatsheetViewer } from './CheatsheetViewer';

const isElectron = !!(window.electronAPI && window.electronAPI.isElectron);
const APP_VERSION = '3.0.0';

// ============================================================
// 預設攻略資料
// ============================================================
function parseBuiltInGuideText(text) {
    const guide = {};
    let currentTitle = '';

    text.trim().replace(/\r\n/g, '\n').split('\n').forEach((rawLine) => {
        const line = rawLine.trim();
        if (!line) return;

        const heading = line.match(/^##\s+(.+)$/);
        if (heading) {
            currentTitle = heading[1].trim();
            guide[currentTitle] = [];
            return;
        }

        if (!currentTitle) return;
        const task = line.replace(/^\d+[.)]\s*/, '').trim();
        if (task) guide[currentTitle].push(task.startsWith('※') ? task : `● ${task}`);
    });

    return guide;
}

const DEFAULT_GUIDE = parseBuiltInGuideText(`
## 第一章
1. 延岸跑，路上開箱子拿技能石，開門進城 。
2. 出城到 暮光海灘，不打小怪一直跑到傳送點 。
3. 跑到 炙熱鹽沼，開始打怪並拿三個螺開路，進 海潮地穴 踩傳送點 。
4. 傳送回 暮光海灘，往下跑到 海潮孤島，殺拿醫藥箱 。
5. 回城找人拿跑藥和技能石 。
6. 傳送到 海潮地穴，跑到中間開傳送門（或水聲之淵門口開門，別進去一會兒才來）。
7. 形往上跑到 沉寂海崖 踩點，殺掉圖騰跑進 碎岩山坡 。
8. 踩點後一路跑到 禁靈之獄下層，走幾步踩點回城 。
9. 走傳送門回到 海潮地穴，往剛才出口相反的方向跑去地洞二層 水聲之淵，殺蟹（天賦點任務）。
10. 回城傳送去 禁靈之獄下層 (帝王迷宮試煉1) 。
11. 解完試煉出來一路跑去上層殺 典獄長 。
12. 殺完出口踩點回城拿位移技能 。
13. 傳送 監獄大門，跑到 魅影船墓 踩傳送點 。
14. 下 魅影船墓洞穴 拿任務物品，跑上地面。往上一直跑到 怨憤之窟 。
15. 踩點傳送回 魅影船墓，向右找到船長殺之（天賦點任務）。
16. 傳送回 怨憤之窟，向右跑到 怨憤之窟深處，向右跑，殺關底首領（職業玩家到這裡20分鐘左右）。

## 第二章
1. 往上跑到森林營地 。
2. 出城跑到 前哨原野 。
3. 往右進入 危機岔路，踩點回城回到 前哨原野 。
4. 在地圖中找到 獸穴，殺白野獸 。
5. 找人拿跑瓶 。
6. 傳送去 危機岔路，沿路往左上跑進入 罪孽之殿 。
7. 中心傳送點的右上方進入 罪孽之殿二層 (帝王迷宮試煉2) 。
8. 解完迷宮出來殺掉第二層的首領 。
9. 回城向左穿過 河道（踩傳送點），沿路跑進入 西部密林 。
10. 沿路去踩點，然後往右下跑到牆，延著牆往右上進入到 織網者巢穴 殺蜘蛛首領 。
11. 回城傳送到 危機岔路，往右下過兩張圖到 寂靜陵墓一層 (帝王迷宮試煉3) 。
12. 傳回 危機岔路，往右到 河畔斷橋，沿著路跑踩傳送點後到底殺掉盜賊 。
13. 回城 河道，往上跑到 濕地，直走殺盜賊 。
14. 在濕地跑踩點傳送 西部密林 。
15. 走剩下的方向跑去幫忙或殺死艾莉亞（殺掉獲得2天賦點）。
16. 沿著牆跑去路口殺黑旗軍回森林營地找艾米爾拿開路道具 。
17. 傳送到 濕地，往上開樹根進入 瓦爾廢墟，過通道到達 北部密林 踩點 。
18. 傳送回第一章獅眼守望拿天賦點 。
19. 傳到 北部密林 沿著牆跑到 瀑布洞穴（注意，不是驚魂樹洞）(跑速工藝)，穿過它來到 古金字塔 。
20. 上樓頂殺首領 。
21. 回城傳送去第三章（37分鐘左右）。

## 第三章
1. 往上跑與人對話然後進入 。
2. 進城以後直接從上面的出口進入 貧民窟 。
3. 穿過 貧民窟 到 火葬場 (帝王迷宮試煉4) 。
4. 解完試煉出來殺派蒂，回程拿下水道鑰匙 。
5. 回 貧民窟，進入下水道 。
6. 拿了3個半身像（天賦點任務）再跑出 市集地帶 踩點 。
7. 進入 黑石陵墓一層 (帝王迷宮試煉5) 。
8. 傳送回市集，直接跑到 激戰廣場 。
9. 踩點，旁邊貨車拿任務物品，往上跑進 不朽海港 拿硫酸 。
10. 回城，拿技能書 。
11. 傳送 激戰廣場，往右上進入 日曜神殿 。
12. 跑到2樓對話拿項鍊和任務物品 。
13. 傳回下水道，往左去 烏旗兵營 踩點 。
14. 往上跑殺掉將軍，繼續往上跑進入 月影神殿 。
15. 跑到二樓殺派蒂 。
16. 回城拿獎勵，去藏身處工藝補電抗 。
17. 傳送 烏旗兵營，向右跑到 皇家花園，踩點後向左上跑 (帝王迷宮試煉6) 。
18. 回到 皇家花園 往右跑進入 神權之塔 。
19. 衝到頂殺神主（60分鐘左右）。

## 第四章
1. 向北直衝進城直接往左去 乾涸湖岸，殺掉福爾 。
2. 回城，跑左邊去 漆黑礦坑 。
3. 下二層，先解救靈魂（天賦點任務），再去 水晶礦脈 。
4. 踩點，進 德瑞索的環境 。
5. 進 大競技場，踩了點就傳送回 水晶礦脈 。
6. 進 岡姆的幻境，一路跑到底殺岡姆 。
7. 回城，傳送去 大競技場，殺德瑞索 。
8. 回城，傳送去 水晶礦脈，開啟 巨獸沼澤 。
9. 衝沖沖，殺派蒂-3小王-馬拉凱 。
10. 回城往上和人對話，跑出城開傳送器去第五章（1:20 左右）。

## 第五章
1. 奴役監牢 跑到底殺首領進城 。
2. 直接走左邊出口去 鎮壓地帶，先找到探測棒（天賦點任務）。
3. 鎮壓地帶 殺首領，去 奧瑞亞大廣場 。
4. 往右上跑到 神聖大教堂 。
5. 右邊形迴路走進 無罪之室 。
6. 貼牆跑到 潔白聖殿 殺爆伊爾莉斯 。
7. 右下出門跑去 焚燒大教堂 。
8. 向上跑個倒形迴路找到 大廣場廢墟 。
9. 貼牆走左邊一點點路進入 葬骨禮堂（門口有傳送點）。
10. 拿純淨之印，回城拿獎勵 。
11. 去過帝王迷宮 。
12. 傳送回  大廣場廢墟，往左過橋往左下進入 聖物間，拿到三件奇塔弗的折磨（天賦點任務）。
13. 傳送回  大廣場廢墟，往左邊過橋左上找到去 聖堂屋頂。
14. 直線跑去奇塔弗房間 。
15. 打完去藏身處補抗性，然後找過劇情（1:40 左右）。

## 第六章
1. 右邊出去 暮光海灘，跑到 炙熱鹽沼 。
2. 殺長老，直奔 卡魯堡壘 。
3. 殺進卡魯堡壘，進入 破碎山脊 。
4. 踩了點直接開回城卷，左邊出門全清 絕望岩灘 。
5. 傳送 破碎山脊，跑到 禁靈之獄 (殘酷帝王試煉1) 。
6. 做完試煉直接跑 薛朗監塔 塔頂，殺薛朗的創造物 。
7. 監獄大門 踩點，回城拿4連頭。
8. 傳送 監獄大門，沿著牆進 飲焰者的災變山谷 殺羊人首領（天賦點任務）。
9. 回到 監獄大門，沿路跑到 西部密林/河道，踩點，往左上進入 濕地
10. 進入 纏盤蛛絲洞 殺傀儡女王首領（天賦點任務）。
11. 傳送 河道，向東穿過 南部森林 進入 忿怒山洞 拿黑旗 。
12. 穿過洞窟，到 絕望烽塔 。
13. 送火炬，下樓和港口船邊的人對話航行到 海洋王堡礁 。
14. 跑到首領房間打完，回城直接傳送到第七章（2:00 左右）。

## 第七章
1. 進入 橋墩營地 。
2. 往上出城到 河畔斷橋，沿著路跑，遇到銀色吊墜就拿了（暴擊瓶任務），然後繼續回到路上跑到 危機叉路 。
3. 在 危機叉路 沿著路跑到傳送點，往下進入 墮道遺跡 。
4. 再沿路跑到 寂靜陵墓 (殘酷帝王試煉2) 。
5. 做完試煉，繼續在寂靜陵墓裡面找到石棺下樓，拿任務物品馬雷格羅的地圖 。
6. 回城傳送去 危機叉路，往上跑到 罪孽之殿一層 。
7. 開地圖進去打死垃圾藝人 。
8. 傳送回一層，跟斯科對話，進入 罪孽之殿二層 (殘酷帝王試煉3) 。
9. 做完試煉通過二層跑 獸穴，進入 旱木原野。
10. 沿著路跑到 堡壘營地 殺賊 。
11. 進入 北部密林，在 驚魂樹洞 門口開個傳送門，然後貼牆跑到 堤道 。
12. 在堤道找到 奇夏拉之星（天賦點任務），然後進 瓦爾城市 。
13. 找到廢墟入口傳送點回城，傳送門進 驚魂樹洞 。
14. 收集螢火蟲，下 絕望之巢 殺格魯絲克（天賦點任務）。
15. 回城，拿3個技能書，傳送 瓦爾城市。
16. 開 腐朽寺廟，直跑樓底殺蜘蛛首領。
17. 殺完回城傳送第八章（2:20 左右）。

## 第八章
1. 到薩恩營地 。
2. 走左下進入 腐化渠道，一路去殺首領 。
3. 殺完出口往右，進入 啟程碼頭，拿十字架，然後找到 甦醒奇點 葬愛（天賦點任務），接著繼續前進到 糧儲關口 殺古靈軍團（天賦點任務）。
4. 傳送回 腐化渠道 往左下，去 宏偉行道 。
5. 從下面繞個大圈，進入 大浴堂 (無情帝王試煉1) 。
6. 做完試煉，往相反的方向去 月影神廣場 踩點 。
7. 回到 大浴堂 ，找到 空中花園 殺了水銀首領（天賦點任務）。
8. 傳送 月影神廣場 一路往上，進入 月影神殿 。
9. 下二層，殺首領拿月影之石 。
10. 回城，傳送 月影神廣場 。
11. 往下跑到 海港大橋，穿過大橋到 日曜神廣場 。
12. 朝上一直跑到 日曜神殿，衝二層殺首領拿太陽 。
13. 回城，傳月影神廣場，往下跑到 海港大橋。
14. 進大橋的 天壇 首領房間殺之 。
15. 出口，去第九章（2:40 左右）。

## 第九章
1. 可選跑殘酷帝王試煉，不急需昇華的也可以留到奇塔弗之前再跑 。
2. 朝上跑出城去 下沉地區 ，進入 瓦斯提里荒漠 找到 風暴之刃 並踩點 。
3. 形路線往上跑到 山麓 。
4. 往上跑踩完點，繼續跑到 沸騰湖泊 殺了石化雞 。
5. 傳送回  瓦斯提里荒漠 找到被風暴阻擋的路，回城拿風暴之瓶開路，然後殺了蝎子首領（天賦點任務）。
6. 傳送去 山麓，向左跑進入 隧道遣跡 (無情帝王試煉2) 。
7. 隧道遣跡向左上跑，踩點，然後回頭做完試煉再進入 廢棄挖石場 。
8. 跑到地圖中間踩點，往左跑貼牆找到 颶風神殿 首領房間殺了（天賦點任務）。
9. 回 廢棄挖石場 往上走進入 破損煉油廠 。
10. 殺了 破損煉油廠 首領，拿粉末，回城傳送 廢棄挖石場 。
11. 跟罪對話進入 獸穴之腹，一直跑進 腐敗之核 。
12. 殺3小王+關底首領 。
13. 回城傳送第十章（3:25）。

## 第十章
1. 上 聖堂之巔 救班恩 。
2. 向右跑到 殘摧大廣場，向地圖右邊過橋踩點，進入 葬骨禮堂 (無情帝王試煉3) 。
3. 傳送回 殘摧大廣場，（在尖塔出口下來這一側）左下跑到 鎮壓地帶，殺房間裡的叛徒首領（天賦點任務）。
4. 傳送回 殘摧大廣場，不過橋向右邊跑到 焚燒大教堂 。
5. 進入 褻瀆之室 。
6. 繞一圈找到 潔白聖殿 殺純淨之神首領，拿 純淨之杖 回城 。
7. 可選跑無情帝王試煉，也可以攢點裝備以後再跑 。
8. 傳送 殘摧大廣場，向右走幾步跟善對話，過兩張圖殺奇塔弗（殺完後抗性總降30%）。
※ 終章提醒：打 /passives 確認 24 點天賦是否拿齊！
`);

const POE2_GUIDE = {
    "PoE2 第一章：皆伐 (Clearfell)": [
        "● 河岸：出生地，擊敗磨坊主後進入皆伐營地",
        "● 皆伐：擊敗腐貝伊拉 (獎勵：+10% 冰冷抗性)",
        "● 格瑞爾林：找到烏娜，推進永恆墓地劇情",
        "● 永恆墓地：收集鑰匙，擊敗拉赫蘭 (獎勵：暗金戒指)",
        "● 獵場：擊敗 Crowbell (獎勵：+2 天賦點)",
        "  ● 獵場：完成儀式 (獎勵：+30 精魂)",
        "● 奧格姆農地：找到烏娜的魯特琴並回報 (獎勵：+2 天賦點)",
        "● 奧格姆村莊：收集工具給倫利，解鎖回收台",
        "● 奧格姆宅邸：擊敗章節最終 BOSS 存活儀式 (獎勵：+20 最大生命)"
    ],
    "PoE2 第二章：瓦斯提里 (Vastiri)": [
        "● 凱斯：擊敗 Kabala (獎勵：+2 天賦點)",
        "● 骨坑與凱斯：收集兩個聖物，回泰坦之谷祭壇選擇 Buff",
        "● 德夏：找到最後的一封信 (獎勵：+2 天賦點)",
        "● 德夏之尖：觸碰加魯汗祭壇 (獎勵：+10% 閃電抗性)",
        "● 失落之城：擊敗黃金甲蟲可獲得珠寶",
        "● 背叛者通道：探索隱藏區域，解鎖昇華職業",
        "● 塔坦石窟：追蹤劇情並擊敗章節最終 BOSS"
    ],
    "PoE2 第三章：阿葛拉特 (Aggorat)": [
        "● 叢林遺跡：擊敗銀拳 Mighty Silverfist (獎勵：+2 天賦點)",
        "● 阿扎克沼澤：擊敗沼澤女巫 Ignagduk (獎勵：+30 精魂)",
        "● 劇毒地窖：找到毒素瓶，交給 NPC 選擇永久 Buff",
        "● 吉誇尼的機械工廠：擊敗 Blackjaw (獎勵：+10% 火焰抗性)",
        "● 吉誇尼的聖所：擊敗 Zicoatl，進入第四章"
    ],
    "PoE2 第四章：恩加馬卡努伊 (Ngamakanui)": [
        "● 祖先之跡：完成試煉找希尼寇拉 (獎勵：+2 武器組專屬天賦點)",
        "● 亡者大廳：完成試煉 (獎勵：屬性與抗性二選一)",
        "● 廢棄監獄：完成探索任務 (獎勵：30% 藥劑生命/法力回復增加)",
        "● 阿拉斯塔：敲響晨鐘 (獎勵：3 個富豪石)",
        "  ● 阿拉斯塔：敲響晚鐘 (獎勵：3 個崇高石)",
        "● 核心目標：在各島嶼擊敗 BOSS 收集地圖碎片，合成前往終局內容的門票"
    ],
    "PoE2 間奏一：霍爾頓的詛咒": [
        "● 觸發：完成第四章後，回皆伐營地與倫利對話",
        "● 進入霍爾頓：前往霍爾頓遺址",
        "● 淨化區域：清理特定被詛咒敵人",
        "● 擊敗 BOSS：面對凋零者或類似精英 BOSS",
        "● 關鍵獎勵：+2 天賦點"
    ],
    "PoE2 間奏二：被盜的巴里亞": [
        "● 觸發：在阿杜拉車隊與加爾或夏利對話",
        "● 追蹤盜賊：前往沙漠新傳點沙塵廢墟",
        "● 奪回裝置：擊敗盜賊首領，找回裝置部件",
        "● 修復巴里亞：回車隊將部件放入祭壇",
        "● 關鍵獎勵：+30 精魂"
    ],
    "PoE2 間奏三：多尼亞尼的應變方案": [
        "● 觸發：在阿葛拉特與多尼亞尼對話",
        "● 收集能源：前往能源核心，注意高密度怪與電擊傷害",
        "● 啟動機制：啟動三個開關並清掉怪物攻勢",
        "● 最終對話：理解異界與地圖系統",
        "● 關鍵獎勵：解鎖地圖裝置，開始 65 級以上異界地圖"
    ],
    "PoE2 終局前提醒": [
        "● 建議先解霍爾頓拿天賦點",
        "● 最後解多尼亞尼，正式開啟 Endgame",
        "● 間奏怪物等級約 62-65，若壓力太高先回第四章島嶼刷裝"
    ]
};

const BUILT_IN_GUIDES = {
    poe2: {
        id: 'poe2',
        name: 'PoE2 開荒',
        badge: 'PoE2',
        description: 'EA 章節與間奏獎勵路線',
        guide: POE2_GUIDE
    },
    poe1: {
        id: 'poe1',
        name: 'PoE1 開荒',
        badge: 'PoE1',
        description: 'ACT 1-10 經典章節路線',
        guide: DEFAULT_GUIDE
    }
};

// ============================================================
// LocalStorage
// ============================================================
const STORAGE_KEY = 'poe_helper_config';
const GUIDE_KEY = 'poe_helper_guide';
const GUIDE_LIBRARY_KEY = 'poe_helper_guide_library_v2';
function loadConfig() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch (e) { } return null; }
function saveConfig(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (e) { } }
function loadGuide() { try { const r = localStorage.getItem(GUIDE_KEY); if (r) return JSON.parse(r); } catch (e) { } return null; }
function saveGuide(d) { try { localStorage.setItem(GUIDE_KEY, JSON.stringify(d)); } catch (e) { } }
function migrateLegacyConfig(config) {
    if (!config) return null;
    const next = { ...config };
    const moveGuideScopedState = (key) => {
        if (!next[key]?.custom_legacy) return;
        next[key] = { ...next[key], poe1: next[key].poe1 ?? next[key].custom_legacy };
        delete next[key].custom_legacy;
    };

    if (next.activeGuideId === 'custom_legacy') next.activeGuideId = 'poe1';
    moveGuideScopedState('actIdxByGuide');
    moveGuideScopedState('checkedByGuide');
    moveGuideScopedState('actImagesByGuide');
    return next;
}
function cloneGuideLibrary(library) { return Object.fromEntries(Object.entries(library).map(([id, guide]) => [id, { ...guide, guide: { ...guide.guide } }])); }
function migrateLegacyGuideIntoDefault(builtIns, saved = {}) {
    const migrated = { ...saved };
    const legacyGuide = migrated.custom_legacy?.guide || loadGuide();

    Object.keys(builtIns).forEach((id) => {
        if (migrated[id] && !migrated[id].customEdited) delete migrated[id];
    });

    if (legacyGuide && !migrated.poe1?.customEdited) {
        migrated.poe1 = {
            ...builtIns.poe1,
            ...(migrated.poe1 || {}),
            guide: legacyGuide,
            description: '由舊版自訂攻略移轉為 PoE1 預設攻略',
            customEdited: true
        };
    }

    if (migrated.custom_legacy) delete migrated.custom_legacy;
    try { localStorage.removeItem(GUIDE_KEY); } catch (e) { }

    return migrated;
}
function loadGuideLibrary() {
    const builtIns = cloneGuideLibrary(BUILT_IN_GUIDES);
    try {
        const raw = localStorage.getItem(GUIDE_LIBRARY_KEY);
        if (raw) {
            const saved = JSON.parse(raw);
            const migrated = migrateLegacyGuideIntoDefault(builtIns, saved);
            const library = { ...builtIns, ...migrated };
            if (saved.custom_legacy || localStorage.getItem(GUIDE_KEY)) saveGuideLibrary(library);
            return library;
        }
    } catch (e) { }

    const legacyGuide = loadGuide();
    if (legacyGuide) {
        const library = { ...builtIns, ...migrateLegacyGuideIntoDefault(builtIns, { poe1: { ...builtIns.poe1, guide: legacyGuide, description: '由舊版自訂攻略移轉為 PoE1 預設攻略', customEdited: true } }) };
        saveGuideLibrary(library);
        return library;
    }

    return builtIns;
}
function saveGuideLibrary(library) {
    try { localStorage.setItem(GUIDE_LIBRARY_KEY, JSON.stringify(library)); } catch (e) { }
}

// ============================================================
// Toast
// ============================================================
const Toast = ({ message, visible }) => (
    <AnimatePresence>
        {visible && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#323232] text-white px-5 py-2 rounded-full shadow-lg text-xs font-medium z-[60]">
                {message}
            </motion.div>
        )}
    </AnimatePresence>
);

// ============================================================
// 攻略編輯器 Modal
// ============================================================
// ============================================================
// Vendor 正規表示式視窗
// ============================================================
const RegexModal = ({ regexes, setRegexes, onClose, dark, toast }) => {
    const [isEditing, setIsEditing] = useState(false);

    const handleCopy = (r) => {
        if (!r.regex) return;
        navigator.clipboard.writeText(r.regex).then(() => {
            toast(`已複製：${r.name}`);
            onClose();
        });
    };

    const handleAdd = () => setRegexes([...regexes, { id: Date.now(), name: '新標籤', regex: '' }]);
    const handleUpdate = (id, k, v) => setRegexes(regexes.map(r => r.id === id ? { ...r, [k]: v } : r));
    const handleRemove = (id) => setRegexes(regexes.filter(r => r.id !== id));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="poe-modal-backdrop fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className={cn("poe-modal w-full max-w-sm max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden",
                    dark ? "text-gray-200 border" : "text-[#e6d8bd] border"
                )}
            >
                {/* 標題 */}
                <div className="poe-modal-header px-5 py-4 flex items-center justify-between border-b shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="poe-modal-icon w-8 h-8 rounded-lg flex items-center justify-center">
                            <Search size={16} />
                        </div>
                        <div>
                            <span className="text-sm font-bold block">正規表示式</span>
                            <p className="poe-modal-subtitle text-[10px] font-medium">點擊標籤即可自動複製字串</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="poe-modal-close p-2 rounded-full transition-colors"><X size={18} /></button>
                </div>

                {/* 列表 */}
                <div className="poe-modal-body flex-1 overflow-y-auto px-4 py-3 space-y-2 custom-scrollbar">
                    {regexes.length === 0 && (
                        <div className="poe-modal-empty text-center py-6 text-xs">目前沒有設定任何正規表示式</div>
                    )}
                    {regexes.map(r => (
                        <div key={r.id} className="poe-modal-list-card flex items-center gap-2 p-2 rounded-xl border transition-all">
                            {isEditing ? (
                                <div className="flex-1 flex flex-col gap-1.5">
                                    <input value={r.name} onChange={e => handleUpdate(r.id, 'name', e.target.value)} placeholder="標籤名稱" className="poe-modal-input text-xs px-2 py-1 rounded focus:outline-none focus:ring-1" />
                                    <input value={r.regex} onChange={e => handleUpdate(r.id, 'regex', e.target.value)} placeholder="正規表示式字串" className="poe-modal-input text-[10px] font-mono px-2 py-1 rounded focus:outline-none focus:ring-1" />
                                </div>
                            ) : (
                                <button onClick={() => handleCopy(r)} className="flex-1 flex items-center justify-between text-left px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors group">
                                    <span className="text-xs font-bold">{r.name}</span>
                                    <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-300" />
                                </button>
                            )}
                            {isEditing && (
                                <button onClick={() => handleRemove(r.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                            )}
                        </div>
                    ))}
                    {isEditing && (
                        <button onClick={handleAdd} className="w-full py-2 flex items-center justify-center gap-1.5 text-xs text-amber-300 hover:bg-red-500/10 rounded-xl border border-dashed border-red-500/30 transition-colors">
                            <Plus size={14} /> 新增正規表示式
                        </button>
                    )}
                </div>

                {/* 底部 */}
                <div className="poe-modal-footer px-5 py-3 flex items-center justify-between border-t shrink-0 select-none">
                    <button onClick={() => setIsEditing(!isEditing)} className={cn("poe-modal-secondary-btn flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors border", isEditing ? "poe-modal-secondary-btn-active" : "")}>
                        {isEditing ? <Check size={14} /> : <FileEdit size={14} />} {isEditing ? '完成編輯' : '編輯列表'}
                    </button>
                    {!isEditing && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 text-amber-300 rounded text-[10px] font-bold border border-red-500/25">
                            <kbd>F8</kbd> 快捷鍵
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

// 快捷圖片視窗已重構至獨立組件

const stripTaskMarker = (line) => {
    const match = line.match(/^(\s*)(?:[-*+●•]|\d+[.)])\s+(?:\[[ xX]\]\s*)?(.*)$/);
    if (!match) return line.trimEnd();

    const indent = match[1].length > 0 ? '  ' : '';
    return `${indent}● ${match[2].trim()}`;
};

const markdownToGuide = (text) => {
    const guide = {};
    let currentTitle = '';
    let currentTasks = [];
    let inFence = false;

    const commitChapter = () => {
        if (!currentTitle) return;
        const tasks = currentTasks.map(task => task.trimEnd()).filter(Boolean);
        if (tasks.length > 0) guide[currentTitle] = tasks;
    };

    text.replace(/\r\n/g, '\n').split('\n').forEach((rawLine) => {
        const line = rawLine.trimEnd();
        if (/^\s*```/.test(line) || /^\s*~~~/.test(line)) {
            inFence = !inFence;
            return;
        }
        if (inFence) return;

        const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
        if (heading) {
            commitChapter();
            currentTitle = heading[1].trim();
            currentTasks = [];
            return;
        }

        if (!line.trim()) return;

        if (!currentTitle) currentTitle = '劇情攻略';
        currentTasks.push(stripTaskMarker(line));
    });

    commitChapter();
    return guide;
};

const guideToMarkdown = (guide) => {
    return Object.entries(guide).map(([chapter, tasks]) => {
        return `## ${chapter}\n${tasks.join('\n')}`;
    }).join('\n\n');
};

const GuideEditor = ({ guideData, guideMeta, onSave, onClose, onReset, dark }) => {
    // 將 guide 物件轉為可編輯的文字格式
    const [text, setText] = useState(guideToMarkdown(guideData));
    const [error, setError] = useState('');
    const guideFileInputRef = useRef(null);

    const importMarkdownText = (markdown) => {
        const parsed = markdownToGuide(markdown);
        if (Object.keys(parsed).length === 0) {
            setError('無法讀取 Markdown：至少需要一個標題與任務內容');
            return;
        }
        setText(guideToMarkdown(parsed));
        setError('');
    };

    const handleImportMarkdown = async () => {
        if (isElectron) {
            const result = await window.electronAPI.selectGuideMarkdown();
            if (result?.content) importMarkdownText(result.content);
            return;
        }
        guideFileInputRef.current?.click();
    };

    const handleBrowserMarkdown = async (event) => {
        const file = event.target.files?.[0];
        if (file) importMarkdownText(await file.text());
        event.target.value = '';
    };

    const handleExportMarkdown = async () => {
        const filename = `${guideMeta?.id || 'poe-guide'}.md`;
        if (isElectron) {
            const result = await window.electronAPI.saveGuideMarkdown({ filename, content: text });
            if (result?.canceled === false) setError('');
            return;
        }

        const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleSave = () => {
        try {
            const parsed = markdownToGuide(text);
            const keys = Object.keys(parsed);
            if (keys.length === 0) { setError('至少需要一個章節'); return; }
            onSave(parsed);
        } catch (e) { setError('格式錯誤，請檢查'); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="poe-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className={cn("poe-modal w-full h-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden",
                    dark ? "text-gray-200 border" : "text-[#e6d8bd] border"
                )}
            >
                {/* 編輯器標題 */}
                <div className="poe-modal-header px-5 py-4 flex items-center justify-between border-b shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="poe-modal-icon w-8 h-8 rounded-lg flex items-center justify-center">
                            <FileEdit size={18} />
                        </div>
                        <div>
                            <span className="text-sm font-bold block">編輯 {guideMeta?.name || '攻略'} 內容</span>
                            <p className="poe-modal-subtitle text-[10px] font-medium">支援 .md 匯入/匯出，只會修改目前選取的攻略</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="poe-modal-close p-2 rounded-full transition-colors"><X size={18} /></button>
                </div>

                {/* 格式說明 */}
                <div className={cn("px-5 py-2.5 text-[11px] shrink-0 border-b flex items-center gap-2", dark ? "bg-[#160f0d] text-amber-100/70 border-red-900/40" : "bg-[#1d130f] text-amber-100/70 border-red-900/40")}>
                    <span className="font-bold bg-red-800 text-amber-100 px-1.5 py-0.5 rounded-[4px] text-[9px]">TIPS</span>
                    <span>格式：支援 Markdown <code className="bg-red-500/10 px-1 rounded font-mono"># / ## 標題</code> 與 <code className="bg-red-500/10 px-1 rounded font-mono">- 任務</code> 清單。</span>
                </div>

                {/* 編輯區 */}
                <div className="flex-1 overflow-hidden p-1 relative flex flex-col">
                    <input ref={guideFileInputRef} type="file" accept=".md,.markdown,text/markdown,text/plain" className="hidden" onChange={handleBrowserMarkdown} />
                    <textarea
                        value={text} onChange={e => { setText(e.target.value); setError(''); }}
                        className={cn("w-full flex-1 px-5 py-4 text-[13px] font-mono resize-y outline-none leading-relaxed custom-scrollbar min-h-[300px] caret-red-400 focus:ring-1 focus:ring-red-500/20",
                            dark ? "bg-[#120d0b] text-amber-100 placeholder-amber-100/30 border-red-900/40" : "bg-[#1a120f] text-amber-100 placeholder-amber-100/30 border-red-900/40"
                        )}
                        placeholder="## 第一章：獅眼守望&#10;● 任務內容一&#10;● 任務內容二"
                        spellCheck={false}
                        autoFocus
                    />
                </div>

                {/* 錯誤提示 */}
                {error && <div className="px-5 py-2 text-xs text-red-300 bg-red-950/40 border-t border-red-900/50 font-medium shrink-0">{error}</div>}

                {/* 底部按鈕 */}
                <div className="poe-modal-footer px-5 py-4 flex items-center justify-between border-t shrink-0">
                    <div className="flex gap-2">
                        <button onClick={onReset}
                            className="poe-modal-secondary-btn flex items-center gap-2 px-3 py-2 text-xs rounded-xl transition-all active:scale-95 border shadow-sm">
                            <Undo2 size={14} /><span>還原</span>
                        </button>
                        <button onClick={handleImportMarkdown}
                            className="poe-modal-secondary-btn flex items-center gap-2 px-3 py-2 text-xs rounded-xl transition-all active:scale-95 border shadow-sm">
                            <Upload size={14} /><span>匯入 .md</span>
                        </button>
                        <button onClick={handleExportMarkdown}
                            className="poe-modal-secondary-btn flex items-center gap-2 px-3 py-2 text-xs rounded-xl transition-all active:scale-95 border shadow-sm">
                            <Download size={14} /><span>匯出 .md</span>
                        </button>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose}
                            className="poe-modal-secondary-btn px-5 py-2 text-xs rounded-xl transition-all border">取消</button>
                        <button onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-2 text-xs text-amber-100 bg-[#8d1420] hover:bg-[#a91b26] rounded-xl transition-all active:scale-95 shadow-lg shadow-red-950/20">
                            <Save size={14} /><span>儲存攻略</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};


// ============================================================
// 快捷鍵設定 Modal
// ============================================================
const HOTKEY_LABELS = {
    toggle: '隱藏/顯示',
    cheatsheet: '快捷圖片',
    regex: '正規表示式',
    timer: '計時器 開始/暫停',
    prevAct: '上一章',
    nextAct: '下一章',
};

const HotkeySettingsModal = ({ hotkeys, onSave, onClose, dark }) => {
    const [draft, setDraft] = useState({ ...hotkeys });
    const [recording, setRecording] = useState(null); // which key is being recorded

    useEffect(() => {
        if (!recording) return;
        const handler = (e) => {
            // 忽略單獨按下控制鍵的情況
            if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

            e.preventDefault();
            e.stopPropagation();

            const modifiers = [];
            if (e.ctrlKey || e.metaKey) modifiers.push('CmdOrCtrl');
            if (e.altKey) modifiers.push('Alt');
            if (e.shiftKey) modifiers.push('Shift');

            let key = e.key;
            if (key === ' ') key = 'Space';
            else if (key.length === 1) key = key.toUpperCase();

            // 組合鍵字串 (例如: CmdOrCtrl+Shift+A)
            const accelerator = [...modifiers, key].join('+');

            setDraft(prev => ({ ...prev, [recording]: accelerator }));
            setRecording(null);
        };
        window.addEventListener('keydown', handler, true);
        return () => window.removeEventListener('keydown', handler, true);
    }, [recording]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="poe-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className={cn("poe-modal w-full max-w-xs rounded-2xl shadow-2xl flex flex-col overflow-hidden",
                    dark ? "text-gray-200 border" : "text-[#e6d8bd] border"
                )}
            >
                {/* 標題 */}
                <div className="poe-modal-header px-5 py-4 flex items-center justify-between border-b shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="poe-modal-icon w-8 h-8 rounded-lg flex items-center justify-center">
                            <Keyboard size={16} />
                        </div>
                        <div>
                            <span className="text-sm font-bold block">自定義快捷鍵</span>
                            <p className="poe-modal-subtitle text-[10px] font-medium">點擊「錄入」後按下想設定的按鍵</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="poe-modal-close p-2 rounded-full transition-colors"><X size={18} /></button>
                </div>

                {/* 快捷鍵列表 */}
                <div className="poe-modal-body px-4 py-3 space-y-2">
                    {Object.entries(HOTKEY_LABELS).map(([key, label]) => (
                        <div key={key} className="poe-modal-list-card flex items-center justify-between p-3 rounded-xl border">
                            <span className="text-xs font-bold">{label}</span>
                            <div className="flex items-center gap-2">
                                <kbd className={cn("text-xs px-2.5 py-1 rounded-lg font-mono font-bold min-w-[40px] text-center",
                                    recording === key
                                        ? "bg-red-500/20 text-amber-300 border border-red-500/30 animate-pulse"
                                        : dark ? "bg-black/30 text-amber-100/80 border border-red-900/40" : "bg-black/25 text-amber-100/80 border border-red-900/40"
                                )}>
                                    {recording === key ? '...' : draft[key]}
                                </kbd>
                                <button onClick={() => setRecording(recording === key ? null : key)}
                                    className={cn("poe-modal-record-btn text-[10px] px-2 py-1 rounded-lg font-medium transition-all active:scale-95",
                                        recording === key ? "poe-modal-record-btn-active" : ""
                                    )}>
                                    {recording === key ? '取消' : '錄入'}
                                </button>
                                <button onClick={() => setDraft(prev => ({ ...prev, [key]: '' }))}
                                    className={cn("p-1.5 rounded-lg transition-colors active:scale-90 opacity-40 hover:opacity-100",
                                        dark ? "hover:bg-red-500/10 text-red-400" : "hover:bg-red-50 text-red-500"
                                    )} title="清除快捷鍵">
                                    <Eraser size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 底部 */}
                <div className="poe-modal-footer px-5 py-3 flex items-center justify-end gap-3 border-t shrink-0">
                    <button onClick={onClose} className="poe-modal-secondary-btn px-4 py-2 text-xs rounded-xl transition-all border">取消</button>
                    <button onClick={() => onSave(draft)} className="flex items-center gap-2 px-5 py-2 text-xs text-amber-100 bg-[#8d1420] hover:bg-[#a91b26] rounded-xl transition-all active:scale-95 shadow-lg shadow-red-950/20">
                        <Save size={14} /><span>儲存</span>
                    </button>
                </div>
            </motion.div>
        </motion.div >
    );
};

// ============================================================
// 主應用
// ============================================================
const TASK_FONT_FAMILY = '"Heiti TC", "LiHei Pro", "PingFang TC", "Microsoft JhengHei", sans-serif';
const MIN_UI_FONT_SIZE = 9;
const MAX_UI_FONT_SIZE = 20;
const FONT_SIZE_OPTIONS = [10, 11, 12, 13, 14, 16, 18, 20];

const App = () => {
    const saved = migrateLegacyConfig(loadConfig());
    const [guideLibrary, setGuideLibrary] = useState(() => loadGuideLibrary());
    const migratedLegacyToPoe1 = guideLibrary.poe1?.customEdited && guideLibrary.poe1?.description?.includes('舊版');
    const initialGuideId = saved?.activeGuideId && guideLibrary[saved.activeGuideId] ? saved.activeGuideId : (migratedLegacyToPoe1 ? 'poe1' : 'poe2');
    const legacyGuideId = saved?.activeGuideId || 'poe1';
    const [activeGuideId, setActiveGuideId] = useState(initialGuideId);
    const [actIdxByGuide, setActIdxByGuide] = useState(saved?.actIdxByGuide ?? { [legacyGuideId]: saved?.last_act ?? 0 });
    const [actIdx, setActIdx] = useState(actIdxByGuide[initialGuideId] ?? (saved?.activeGuideId ? saved?.last_act ?? 0 : 0));
    const [checkedByGuide, setCheckedByGuide] = useState(saved?.checkedByGuide ?? { [legacyGuideId]: saved?.checked ?? {} });
    const [elapsedMs, setElapsedMs] = useState(saved?.time ?? 0);
    const [isRunning, setIsRunning] = useState(false);
    const [opacity, setOpacity] = useState(saved?.alpha ?? 0.9);
    const [dark, setDark] = useState(saved?.dark ?? true);
    const initialFontSize = saved?.fontSize ?? 13;
    const [fontSize, setFontSize] = useState(initialFontSize);
    // 多張快捷圖片 (從舊的單張格式自動遷移)
    const [cheatsheets, setCheatsheets] = useState(() => {
        if (saved?.cheatsheets && Array.isArray(saved.cheatsheets)) return saved.cheatsheets;
        if (saved?.cheatsheet) return [saved.cheatsheet];
        return [];
    });
    const [actImagesByGuide, setActImagesByGuide] = useState(saved?.actImagesByGuide ?? { [legacyGuideId]: saved?.actImages ?? {} });
    const [showActMap, setShowActMap] = useState(false);
    const [regexes, setRegexes] = useState(saved?.regexes ?? [
        { id: 1, name: '3連色 (紅綠藍)', regex: 'r-g-b|r-b-g|g-r-b|g-b-r|b-r-g|b-g-r' },
        { id: 2, name: '跑速鞋 (10%以上)', regex: '1[0-9]% increased movement speed' }
    ]);
    const [showRegex, setShowRegex] = useState(false);
    const [showCheatsheet, setShowCheatsheet] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [showHotkeySettings, setShowHotkeySettings] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [toastVisible, setToastVisible] = useState(false);
    // 隱藏計時器 & 任務攻略
    const [showTimer, setShowTimer] = useState(saved?.showTimer ?? true);
    const [showGuide, setShowGuide] = useState(saved?.showGuide ?? true);
    // 快捷鍵
    const [hotkeys, setHotkeys] = useState({ toggle: 'F10', cheatsheet: 'F9', regex: 'F8', timer: '', prevAct: '', nextAct: '' });

    // --- 更新狀態 ---
    const [updateStatus, setUpdateStatus] = useState(null); // 'available' | 'downloading' | 'downloaded' | 'error'
    const [updateVersion, setUpdateVersion] = useState('');
    const [updateProgress, setUpdateProgress] = useState(0);

    const activeGuide = guideLibrary[activeGuideId] || BUILT_IN_GUIDES.poe2;
    const guideData = activeGuide.guide || {};
    const checkedTasks = checkedByGuide[activeGuideId] || {};
    const actImages = actImagesByGuide[activeGuideId] || {};
    const guideOptions = Object.values(guideLibrary);
    const acts = Object.keys(guideData);
    const safeActIdx = actIdx < acts.length ? actIdx : 0;
    const currentAct = acts[safeActIdx];
    const startTimeRef = useRef(Date.now() - elapsedMs);
    const actImageInputRef = useRef(null);
    const cheatsheetInputRef = useRef(null);

    // --- 初始化載入快捷鍵 ---
    useEffect(() => {
        if (!isElectron) return;
        window.electronAPI.getHotkeys().then(hk => { if (hk) setHotkeys(hk); });
    }, []);

    useEffect(() => {
        document.documentElement.style.setProperty('--poe-ui-scale', String(fontSize / 13));
        return () => document.documentElement.style.removeProperty('--poe-ui-scale');
    }, [fontSize]);

    // --- 計時器 ---
    useEffect(() => {
        let raf;
        const tick = () => { setElapsedMs(Date.now() - startTimeRef.current); raf = requestAnimationFrame(tick); };
        if (isRunning) { startTimeRef.current = Date.now() - elapsedMs; raf = requestAnimationFrame(tick); }
        return () => cancelAnimationFrame(raf);
    }, [isRunning]);

    // --- 快捷圖片快捷鍵 ---
    useEffect(() => {
        if (!isElectron) return;
        const toggle = async () => {
            if (cheatsheets.length === 0) {
                toast('請先至設定選擇快捷圖片');
                return;
            }
            const isOpen = await window.electronAPI.isViewerOpen('cheatsheet');
            if (isOpen) {
                window.electronAPI.closeViewer('cheatsheet');
            } else {
                window.electronAPI.openViewer({ id: 'cheatsheet', title: '快捷圖片', images: cheatsheets, hotkeyLabel: hotkeys.cheatsheet });
            }
        };
        window.electronAPI.onToggleCheatsheet(toggle);
        return () => window.electronAPI.offToggleCheatsheet();
    }, [cheatsheets, hotkeys.cheatsheet]);

    // --- 同步資料給已開啟的子視窗 ---
    useEffect(() => {
        if (isElectron) {
            window.electronAPI.isViewerOpen('cheatsheet').then(isOpen => {
                if (isOpen) window.electronAPI.updateViewerData('cheatsheet', { images: cheatsheets, hotkeyLabel: hotkeys.cheatsheet });
            });
        }
    }, [cheatsheets, hotkeys.cheatsheet]);

    useEffect(() => {
        if (isElectron && actImages[currentAct]) {
            window.electronAPI.isViewerOpen('actMap').then(isOpen => {
                if (isOpen) window.electronAPI.updateViewerData('actMap', { images: actImages[currentAct], hotkeyLabel: '100%' });
            });
        }
    }, [currentAct, actImages, activeGuideId]);

    // --- Regex 快捷鍵 ---
    useEffect(() => {
        if (!isElectron) return;
        const toggleRegex = () => setShowRegex(prev => !prev);
        window.electronAPI.onToggleRegex(toggleRegex);
        return () => window.electronAPI.offToggleRegex();
    }, []);

    // --- 計時器、章節快捷鍵 ---
    useEffect(() => {
        if (!isElectron) return;
        const toggleTimer = () => setIsRunning(v => !v);
        window.electronAPI.onToggleTimer(toggleTimer);
        return () => window.electronAPI.offToggleTimer();
    }, []);

    const nextAct = useCallback(() => setActIdx(i => (i + 1) % acts.length), [acts.length]);
    const prevAct = useCallback(() => setActIdx(i => (i - 1 + acts.length) % acts.length), [acts.length]);

    useEffect(() => {
        if (!isElectron) return;
        window.electronAPI.onPrevAct(prevAct);
        window.electronAPI.onNextAct(nextAct);
        return () => {
            window.electronAPI.offPrevAct();
            window.electronAPI.offNextAct();
        };
    }, [prevAct, nextAct]);

    // --- 監聽快捷鍵變更事件 ---
    useEffect(() => {
        if (!isElectron) return;
        window.electronAPI.onHotkeysChanged(hk => setHotkeys(hk));
        return () => window.electronAPI.offHotkeysChanged();
    }, []);

    // --- 監聽更新事件 ---
    useEffect(() => {
        if (!isElectron) return;

        window.electronAPI.onUpdateAvailable((version) => {
            setUpdateStatus('available');
            setUpdateVersion(version);
            toast(`發現新版本 v${version}，正在背景下載...`);
        });

        window.electronAPI.onUpdateProgress((percent) => {
            setUpdateStatus('downloading');
            setUpdateProgress(percent);
        });

        window.electronAPI.onUpdateDownloaded((version) => {
            setUpdateStatus('downloaded');
            setUpdateVersion(version);
            setUpdateProgress(100);
            toast(`新版本 v${version} 已下載完成！`);
        });

        window.electronAPI.onUpdateError((msg) => {
            setUpdateStatus('error');
            setTimeout(() => setUpdateStatus(null), 5000);
            toast(`更新失敗: ${msg}`);
        });

        return () => window.electronAPI.offUpdateEvents();
    }, []);

    const fmt = (ms) => {
        const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // --- 持久化 ---
    const persist = useCallback(() => {
        saveConfig({
            activeGuideId,
            last_act: safeActIdx,
            actIdxByGuide: { ...actIdxByGuide, [activeGuideId]: safeActIdx },
            checkedByGuide,
            checked: checkedTasks,
            time: elapsedMs,
            alpha: opacity,
            dark,
            fontSize,
            cheatsheets,
            actImagesByGuide,
            actImages,
            regexes,
            showTimer,
            showGuide
        });
        saveGuideLibrary(guideLibrary);

        // 請求清理未使用的圖片檔案
        if (isElectron) {
            const activeUrls = new Set();
            cheatsheets.forEach(url => activeUrls.add(url));
            Object.values(actImagesByGuide).forEach(imagesByAct => {
                Object.values(imagesByAct || {}).forEach(arr => {
                    arr.forEach(url => activeUrls.add(url));
                });
            });
            window.electronAPI.cleanupImages(Array.from(activeUrls));
        }
    }, [activeGuideId, safeActIdx, actIdxByGuide, checkedByGuide, checkedTasks, elapsedMs, opacity, dark, fontSize, cheatsheets, actImagesByGuide, actImages, regexes, showTimer, showGuide, guideLibrary]);
    useEffect(() => { persist(); }, [activeGuideId, safeActIdx, checkedByGuide, opacity, dark, fontSize, cheatsheets, actImagesByGuide, regexes, showTimer, showGuide, guideLibrary]);
    useEffect(() => { if (!isRunning) { persist(); return; } const id = setInterval(persist, 5000); return () => clearInterval(id); }, [isRunning, persist]);

    const handleOpacity = (val) => { setOpacity(val); if (isElectron) window.electronAPI.setOpacity(val); };
    const handleFontSize = (value) => {
        const next = Math.min(MAX_UI_FONT_SIZE, Math.max(MIN_UI_FONT_SIZE, Math.round(Number.isFinite(value) ? value : fontSize)));
        setFontSize(next);
    };
    const setActiveCheckedTasks = (updater) => {
        setCheckedByGuide(prev => {
            const current = prev[activeGuideId] || {};
            const next = typeof updater === 'function' ? updater(current) : updater;
            return { ...prev, [activeGuideId]: next };
        });
    };
    const setActiveActImages = (updater) => {
        setActImagesByGuide(prev => {
            const current = prev[activeGuideId] || {};
            const next = typeof updater === 'function' ? updater(current) : updater;
            return { ...prev, [activeGuideId]: next };
        });
    };
    const toBrowserImageUrls = (files) => Array.from(files || []).map(file => URL.createObjectURL(file));
    const handleBrowserActImages = (event) => {
        const urls = toBrowserImageUrls(event.target.files);
        if (urls.length > 0) {
            setActiveActImages(prev => {
                const existing = prev[currentAct] || [];
                return { ...prev, [currentAct]: [...existing, ...urls] };
            });
            toast(`已為 ${currentAct} 新增圖片`);
        }
        event.target.value = '';
    };
    const handleBrowserCheatsheets = (event) => {
        const urls = toBrowserImageUrls(event.target.files);
        if (urls.length > 0) {
            setCheatsheets(prev => [...prev, ...urls]);
            toast(`已新增 ${urls.length} 張圖片`);
        }
        event.target.value = '';
    };
    const toggleTask = (task) => { const k = `${currentAct}_${task}`; setActiveCheckedTasks(p => ({ ...p, [k]: !p[k] })); };

    const switchGuide = (guideId) => {
        if (!guideLibrary[guideId] || guideId === activeGuideId) return;
        setActIdxByGuide(prev => ({ ...prev, [activeGuideId]: safeActIdx }));
        setActiveGuideId(guideId);
        setActIdx(actIdxByGuide[guideId] ?? 0);
        if (isElectron) {
            window.electronAPI.isViewerOpen('actMap').then(isOpen => {
                if (isOpen) window.electronAPI.closeViewer('actMap');
            });
        }
        toast(`已切換到 ${guideLibrary[guideId].name}`);
    };

    const resetAll = () => {
        if (!window.confirm(`確認重置「${activeGuide.name}」的進度與計時？其他攻略不會被清除。`)) return;
        setActiveCheckedTasks({}); setElapsedMs(0); setIsRunning(false); setActIdx(0);
        setActIdxByGuide(prev => ({ ...prev, [activeGuideId]: 0 }));
        startTimeRef.current = Date.now();
        saveConfig({ activeGuideId, last_act: 0, actIdxByGuide: { ...actIdxByGuide, [activeGuideId]: 0 }, checkedByGuide: { ...checkedByGuide, [activeGuideId]: {} }, checked: {}, time: 0, alpha: opacity, dark, fontSize, cheatsheets, actImagesByGuide, actImages, regexes, showTimer, showGuide });
        toast('進度已重置');
    };

    const toast = (msg) => { setToastMsg(msg); setToastVisible(true); setTimeout(() => setToastVisible(false), 2500); };

    // --- 攻略儲存 ---
    const handleGuideSave = (newGuide) => {
        setGuideLibrary(prev => ({ ...prev, [activeGuideId]: { ...prev[activeGuideId], guide: newGuide, customEdited: true } }));
        setActIdx(0); setActiveCheckedTasks({});
        setActIdxByGuide(prev => ({ ...prev, [activeGuideId]: 0 }));
        setShowEditor(false);
        toast(`${activeGuide.name} 已更新`);
    };
    const handleGuideReset = () => {
        const resetGuideId = BUILT_IN_GUIDES[activeGuideId] ? activeGuideId : 'poe2';
        setGuideLibrary(prev => {
            const next = { ...prev };
            if (BUILT_IN_GUIDES[activeGuideId]) {
                next[activeGuideId] = cloneGuideLibrary(BUILT_IN_GUIDES)[activeGuideId];
            } else {
                delete next[activeGuideId];
            }
            saveGuideLibrary(next);
            return next;
        });
        if (resetGuideId !== activeGuideId) setActiveGuideId(resetGuideId);
        localStorage.removeItem(GUIDE_KEY);
        setActIdx(0); setActiveCheckedTasks({});
        setActIdxByGuide(prev => ({ ...prev, [resetGuideId]: 0 }));
        setShowEditor(false);
        toast('已還原此攻略預設內容');
    };

    // --- 進度 ---
    const totalTasks = Object.values(guideData).flat().length;
    const completedTasks = Object.values(checkedTasks).filter(Boolean).length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const currentTasks = guideData[currentAct] || [];
    const currentCompleted = currentTasks.filter(t => checkedTasks[`${currentAct}_${t}`]).length;
    const currentPercent = currentTasks.length > 0 ? Math.round((currentCompleted / currentTasks.length) * 100) : 0;

    // --- 主題色 ---
    const bg = dark ? 'poe-bg-dark' : 'poe-bg-parchment';
    const cardBg = dark ? 'poe-panel' : 'poe-panel poe-panel-light';
    const textPrimary = dark ? 'poe-text-primary' : 'poe-text-ink';
    const textSecondary = dark ? 'poe-text-secondary' : 'poe-text-muted';
    const border = 'poe-border';

    return (
        <div className={cn("poe-shell flex flex-col h-full font-sans overflow-hidden rounded-xl relative", bg, textPrimary, dark ? 'poe-mode-dark' : 'poe-mode-light')}>

            {/* ===== 標題列 ===== */}
            <header className={cn("poe-titlebar px-2.5 py-2 flex items-center justify-between z-10 select-none shrink-0 border-b", cardBg, border)}
                style={{ WebkitAppRegion: 'drag' }}>
                <div className="flex items-center gap-2">
                    <div className="poe-sigil w-6 h-6 rounded-lg flex items-center justify-center text-white">
                        <Sword size={12} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-xs font-bold leading-none">
                            {activeGuide.name} · {completedTasks}/{totalTasks} ({progressPercent}%)
                            <span className="ml-1.5 opacity-50 font-normal text-[9px]">v{APP_VERSION}</span>
                            {updateStatus === 'downloaded' && (
                                <span className="poe-update-badge ml-1.5 px-1 rounded-[4px] text-[8px] animate-pulse">UPDATE READY</span>
                            )}
                        </h1>
                        <p className={cn("text-[9px] font-medium", textSecondary)}>
                            {updateStatus === 'downloading'
                                ? `正在下載更新: ${Math.round(updateProgress)}%`
                                : `${activeGuide.description}${isElectron ? ` · ${hotkeys.toggle} 隱藏` : ''}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-0.5" style={{ WebkitAppRegion: 'no-drag' }}>
                    <button onClick={resetAll} className={cn("poe-icon-btn p-1.5 rounded-full transition-all active:scale-90 hover:bg-red-500/10 hover:text-red-400", textSecondary)} title="重置進度">
                        <RotateCcw size={14} />
                    </button>
                    <button onClick={() => setShowSettings(s => !s)} className={cn("poe-icon-btn p-1.5 rounded-full transition-all active:scale-90", showSettings ? "poe-icon-btn-active" : textSecondary)} title="設定">
                        <Settings size={14} />
                    </button>
                    {isElectron && (<>
                        <button onClick={() => window.electronAPI.minimizeWindow()} className={cn("poe-icon-btn p-1.5 rounded-full transition-colors", textSecondary)} title="最小化"><Minus size={14} /></button>
                        <button onClick={() => window.electronAPI.closeWindow()} className={cn("poe-icon-btn p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-full transition-colors", textSecondary)} title="關閉"><X size={14} /></button>
                    </>)}
                </div>
            </header>

            {/* 更新進度條 */}
            <AnimatePresence>
                {updateStatus === 'downloading' && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 2 }} exit={{ height: 0 }} className="poe-progress-track w-full overflow-hidden shrink-0">
                        <motion.div className="h-full poe-progress-fill" initial={{ width: 0 }} animate={{ width: `${updateProgress}%` }} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== 設定面板 ===== */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                        className={cn("poe-settings-panel overflow-hidden border-b shrink-0", cardBg, border)}>
                        <div className="px-3 py-2.5 space-y-2.5">

                            {/* 攻略切換 */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5"><ListChecks size={12} className={textSecondary} /><span className="text-[11px] font-medium">攻略版本</span></div>
                                    <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded-md", textSecondary)}>{safeActIdx + 1}/{acts.length} 章節</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {guideOptions.map(guide => {
                                        const checked = checkedByGuide[guide.id] || {};
                                        const guideTotal = Object.values(guide.guide || {}).flat().length;
                                        const guideDone = Object.values(checked).filter(Boolean).length;
                                        const isActive = guide.id === activeGuideId;
                                        return (
                                            <button key={guide.id} onClick={() => switchGuide(guide.id)}
                                                className={cn("poe-guide-card text-left rounded-xl px-3 py-2 border transition-all active:scale-95", isActive ? "poe-guide-card-active" : "poe-guide-card-idle")}
                                                title={guide.description}>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[11px] font-bold truncate">{guide.name}</span>
                                                    <span className="text-[9px] font-mono opacity-70">{guideDone}/{guideTotal}</span>
                                                </div>
                                                <div className={cn("mt-0.5 text-[9px] leading-snug truncate", textSecondary)}>{guide.description}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 透明度 */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5"><Eye size={12} className={textSecondary} /><span className="text-[11px] font-medium">透明度</span></div>
                                    <span className={cn("poe-chip text-[10px] font-mono px-1.5 py-0.5 rounded-md", textSecondary)}>{Math.round(opacity * 100)}%</span>
                                </div>
                                <input type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={e => handleOpacity(parseFloat(e.target.value))} className="poe-range w-full h-1 rounded-lg appearance-none cursor-pointer" />
                            </div>

                            {/* 深淺模式 & 自訂快捷鍵 (Row 2) */}
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setDark(d => !d)}
                                    className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 justify-center min-w-0",
                                        dark ? "poe-action-secondary" : "poe-action-secondary"
                                    )}>
                                    {dark ? <Sun size={12} /> : <Moon size={12} />}
                                    <span>{dark ? '淺色模式' : '深色模式'}</span>
                                </button>
                                <div className="min-w-0">
                                    <button onClick={() => setShowFontSizeMenu(v => !v)}
                                        className={cn("poe-font-size-trigger w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95", "poe-action-secondary")}
                                        title="選擇文字大小"
                                        aria-expanded={showFontSizeMenu}
                                        aria-haspopup="menu">
                                        <Type size={12} />
                                        <span className="truncate">文字大小</span>
                                        <span className="font-mono text-[10px] opacity-75">{fontSize}px</span>
                                    </button>
                                </div>
                            </div>

                            {showFontSizeMenu && (
                                <div className="poe-font-size-menu grid grid-cols-4 gap-1 rounded-lg border p-1" role="menu" aria-label="文字大小選單">
                                    {FONT_SIZE_OPTIONS.map(size => (
                                        <button key={size}
                                            onClick={() => { handleFontSize(size); setShowFontSizeMenu(false); }}
                                            className={cn("flex items-center justify-center rounded-md px-2 py-1.5 text-[10px] font-medium transition-all active:scale-95",
                                                size === fontSize ? "poe-font-size-option-active" : "poe-font-size-option"
                                            )}
                                            role="menuitem">
                                            {size === 13 ? '預設' : `${size}px`}
                                        </button>
                                    ))}
                                </div>
                            )}



                            {/* 自定義攻略與正規表示式 (同一行) */}
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => { setShowEditor(true); setShowSettings(false); }}
                                    className={cn("flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 min-w-0",
                                        "poe-action-secondary"
                                    )}>
                                    <FileEdit size={12} /><span>劇情攻略</span>
                                </button>
                                <button onClick={() => { setShowRegex(true); setShowSettings(false); }}
                                    className={cn("flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 min-w-0",
                                        "poe-action-secondary"
                                    )}>
                                    <Search size={12} /><span>正規表示式</span>
                                </button>
                            </div>

                            {/* 顯示/隱藏 計時器 & 攻略 */}
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setShowTimer(v => !v)}
                                    className={cn("flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 min-w-0",
                                        showTimer ? "poe-action-success" : "poe-action-muted opacity-70"
                                    )}>
                                    <Timer size={12} /><span>{showTimer ? '隱藏計時器' : '顯示計時器'}</span>
                                </button>
                                <button onClick={() => setShowGuide(v => !v)}
                                    className={cn("flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 min-w-0",
                                        showGuide ? "poe-action-success" : "poe-action-muted opacity-70"
                                    )}>
                                    <ListChecks size={12} /><span>{showGuide ? '隱藏攻略' : '顯示攻略'}</span>
                                </button>
                            </div>

                            <button onClick={() => { setShowHotkeySettings(true); setShowSettings(false); }}
                                className={cn("w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95",
                                    "poe-action-secondary"
                                )}
                                title={isElectron ? "設定全域快捷鍵" : "瀏覽器預覽可調整顯示值，實際全域快捷鍵需使用 Electron 版"}>
                                <Keyboard size={12} /><span>自訂快捷鍵</span>
                            </button>

                            {/* 路線圖 & 快捷圖片 */}
                            <div className="grid grid-cols-2 gap-2">
                                {/* 路線圖 */}
                                <div className="flex items-center gap-1 min-w-0">
                                    <button onClick={async () => {
                                        if (isElectron) {
                                            const paths = await window.electronAPI.selectImages();
                                            if (paths && paths.length > 0) {
                                                setActiveActImages(prev => {
                                                    const existing = prev[currentAct] || [];
                                                    return { ...prev, [currentAct]: [...existing, ...paths] };
                                                });
                                                toast(`已為 ${currentAct} 新增圖片`);
                                            }
                                        } else {
                                            actImageInputRef.current?.click();
                                        }
                                    }}
                                        className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 min-w-0",
                                            "poe-action-secondary"
                                        )} title={`為「${currentAct}」設定專屬路線圖圖片`}>
                                        <ImagePlus size={12} /><span className="truncate">本章路線圖</span>
                                        <span>({actImages[currentAct]?.length || 0})</span>
                                    </button>
                                    {actImages[currentAct]?.length > 0 && (
                                        <button onClick={() => {
                                            setActiveActImages(prev => {
                                                const next = { ...prev };
                                                delete next[currentAct];
                                                return next;
                                            });
                                            toast(`已清除 ${currentAct} 的路線圖`);
                                        }}
                                            className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0" title="清除本章路線圖">
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                                {/* 快捷圖片 */}
                                <div className="flex items-center gap-1 min-w-0">
                                    <button onClick={async () => {
                                        if (isElectron) {
                                            const paths = await window.electronAPI.selectImages();
                                            if (paths && paths.length > 0) { setCheatsheets(prev => [...prev, ...paths]); toast(`已新增 ${paths.length} 張圖片`); }
                                        } else {
                                            cheatsheetInputRef.current?.click();
                                        }
                                    }}
                                        className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 min-w-0",
                                            "poe-action-secondary"
                                        )}>
                                        <ImageIcon size={12} /><span>快捷圖片 ({cheatsheets.length})</span>
                                    </button>
                                    {cheatsheets.length > 0 && (
                                        <button onClick={() => { setCheatsheets([]); toast('已清除所有圖片'); }}
                                            className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0" title="清除全部">
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                                <input ref={actImageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleBrowserActImages} />
                                <input ref={cheatsheetInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleBrowserCheatsheets} />
                            </div>

                            {/* 快捷鍵提示與開啟資料夾 */}
                            <div className="flex items-center gap-2">
                                <div className={cn("poe-hotkey-strip flex-1 text-[9px] px-2.5 py-1.5 rounded-lg leading-relaxed", textSecondary)}>
                                    {`${hotkeys.cheatsheet || 'F9'} 快捷圖片 · ${hotkeys.regex || 'F8'} 正規表示式 · ${hotkeys.toggle || 'F10'} 隱藏/顯示`}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <button onClick={() => {
                                        if (!isElectron) {
                                            toast('Electron 版才支援檢查更新');
                                            return;
                                        }
                                        window.electronAPI.checkForUpdates();
                                        toast('正在檢查更新...');
                                        setUpdateStatus('checking');
                                        setTimeout(() => { if (updateStatus === 'checking') setUpdateStatus(null); }, 10000);
                                    }}
                                        className={cn("px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all active:scale-95 flex items-center gap-1.5",
                                            "poe-action-secondary"
                                        )} title="立刻檢查有無新版本">
                                        檢查更新
                                    </button>
                                    <button onClick={() => {
                                        if (!isElectron) {
                                            toast('Electron 版才支援開啟圖片資料夾');
                                            return;
                                        }
                                        window.electronAPI.openImagesFolder();
                                    }}
                                        className={cn("px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all active:scale-95 flex items-center gap-1.5",
                                            "poe-action-secondary"
                                        )} title="開啟圖片儲存目錄尋找/刪除圖片">
                                        <FolderOpen size={12} /><span>圖片資料夾</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== 計時器 ===== */}
            {showTimer && (
                <div className={cn("poe-timerbar px-3 py-2 flex items-center justify-center gap-3 mb-px shrink-0", cardBg)}>
                    <div className="poe-clock text-2xl font-mono font-bold px-4 py-1 rounded-xl tracking-wider select-none">
                        {fmt(elapsedMs)}
                    </div>
                    <button onClick={() => setIsRunning(!isRunning)}
                        className={cn("flex items-center gap-1.5 px-4 py-1.5 rounded-full font-medium text-xs transition-all active:scale-95 shadow-sm",
                            isRunning ? "poe-danger-btn" : "poe-primary-btn"
                        )}>
                        {isRunning ? <Pause size={14} /> : <Play size={14} />}
                        <span>{isRunning ? '暫停' : '計時'}</span>
                    </button>
                    <button onClick={() => { setElapsedMs(0); setIsRunning(false); startTimeRef.current = Date.now(); toast('計時器已歸零'); }}
                        className={cn("poe-icon-btn p-1.5 rounded-full transition-all active:scale-90", textSecondary)} title="重置計時">
                        <RotateCcw size={14} />
                    </button>
                </div>
            )}

            {/* ===== 章節導航 + 任務列表 ===== */}
            {showGuide && (<>
                <div className={cn("poe-actbar px-2 py-1.5 flex items-center border-b shrink-0", cardBg, border)}>
                    <button onClick={prevAct} className="poe-icon-btn p-1 rounded-full transition-colors active:scale-90">
                        <ChevronLeft size={18} className={textSecondary} />
                    </button>
                    <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
                        <div className="flex items-center gap-1">
                            <h2 className="poe-act-pill text-xs font-bold px-2.5 py-0.5 rounded-md truncate">
                                {currentAct}
                            </h2>
                            <button onClick={async () => {
                                if (actImages[currentAct] && actImages[currentAct].length > 0) {
                                    if (isElectron) {
                                        const isOpen = await window.electronAPI.isViewerOpen('actMap');
                                        if (isOpen) {
                                            window.electronAPI.closeViewer('actMap');
                                        } else {
                                            window.electronAPI.openViewer({ id: 'actMap', title: `路線圖 - ${currentAct}`, images: actImages[currentAct], hotkeyLabel: '100%' });
                                        }
                                    } else {
                                        setShowActMap(true);
                                    }
                                } else if (isElectron) {
                                    window.electronAPI.selectImages().then(paths => {
                                        if (paths && paths.length > 0) {
                                            setActiveActImages(prev => {
                                                const existing = prev[currentAct] || [];
                                                return { ...prev, [currentAct]: [...existing, ...paths] };
                                            });
                                            toast(`已為 ${currentAct} 新增路線圖`);
                                        }
                                    });
                                } else {
                                    toast('請在應用程式中新增圖片');
                                }
                            }} className={cn("poe-icon-btn p-1.5 rounded-lg transition-colors active:scale-90",
                                actImages[currentAct] && actImages[currentAct].length > 0
                                    ? "poe-icon-btn-active"
                                    : textSecondary
                            )} title={actImages[currentAct] && actImages[currentAct].length > 0 ? "查看本章路線圖" : "新增本章路線圖"}>
                                <ImagePlus size={14} />
                            </button>
                        </div>
                        <span className={cn("text-[9px] font-medium whitespace-nowrap shrink-0", textSecondary)}>
                            {currentCompleted}/{currentTasks.length} · {safeActIdx + 1}/{acts.length}章
                        </span>
                    </div>
                    <button onClick={nextAct} className="poe-icon-btn p-1 rounded-full transition-colors active:scale-90">
                        <ChevronRight size={18} className={textSecondary} />
                    </button>
                </div>

                {/* 進度條 */}
                <div className="poe-progress-track h-[3px] shrink-0">
                    <motion.div className="h-full poe-progress-fill rounded-r-full" initial={false} animate={{ width: `${currentPercent}%` }} transition={{ duration: 0.3, ease: 'easeOut' }} />
                </div>

                {/* 任務列表 */}
                <main className={cn("poe-tasklist flex-1 overflow-y-auto px-2.5 py-2 space-y-1 custom-scrollbar", bg)}>
                    <AnimatePresence mode="wait">
                        <motion.div key={currentAct} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }} className="space-y-1">
                            {currentTasks.map((task, index) => {
                                const isChecked = !!checkedTasks[`${currentAct}_${task}`];
                                const isSubTask = /^\s+/.test(task) || task.trimStart().startsWith('-') || task.trimStart().startsWith('>');
                                const displayTask = task.trimStart();
                                return (
                                    <motion.div key={`${currentAct}_${index}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
                                        whileTap={{ scale: 0.98 }} onClick={() => toggleTask(task)}
                                        className={cn("poe-task flex items-start gap-2 px-2.5 py-2 rounded-xl border cursor-pointer group transition-all",
                                            isSubTask ? "ml-6" : "",
                                            isChecked
                                                ? "poe-task-done"
                                                : "poe-task-open"
                                        )}>
                                        <div className={cn("poe-checkbox mt-0.5 w-4 h-4 rounded-[5px] border-[1.5px] flex items-center justify-center transition-all shrink-0",
                                            isChecked ? "poe-checkbox-done" : "poe-checkbox-open"
                                        )}>
                                            {isChecked && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={10} strokeWidth={4} /></motion.div>}
                                        </div>
                                        <span style={{ fontSize: `${fontSize}px`, fontFamily: TASK_FONT_FAMILY }} className={cn("leading-relaxed select-none transition-all",
                                            isChecked ? dark ? "text-gray-600 line-through" : "text-gray-400 line-through" : ""
                                        )}>
                                            {displayTask}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </>)}

            {/* ===== 右下角縮放把手 ===== */}
            {isElectron && (
                <div className={cn("absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-0.5 pointer-events-none transition-colors", textSecondary)}
                    style={{ WebkitAppRegion: 'no-drag' }}>
                    <GripVertical size={12} className="rotate-[-45deg] opacity-50" />
                </div>
            )}

            {/* ===== 攻略編輯器 ===== */}
            <AnimatePresence>
                {showEditor && (
                    <GuideEditor guideData={guideData} guideMeta={activeGuide} onSave={handleGuideSave} onClose={() => setShowEditor(false)} onReset={handleGuideReset} dark={dark} />
                )}
            </AnimatePresence>

            {/* ===== 快捷圖片視窗 ===== */}
            <AnimatePresence>
                {!isElectron && showCheatsheet && (
                    <CheatsheetViewer images={cheatsheets} onClose={() => setShowCheatsheet(false)} hotkeyLabel={hotkeys.cheatsheet} />
                )}
            </AnimatePresence>

            {/* ===== 路線圖視窗 ===== */}
            <AnimatePresence>
                {!isElectron && showActMap && (
                    <CheatsheetViewer images={actImages[currentAct] || []} onClose={() => setShowActMap(false)} hotkeyLabel="100%" />
                )}
            </AnimatePresence>

            {/* ===== Regex 視窗 ===== */}
            <AnimatePresence>
                {showRegex && (
                    <RegexModal regexes={regexes} setRegexes={setRegexes} onClose={() => setShowRegex(false)} dark={dark} toast={toast} />
                )}
            </AnimatePresence>

            {/* ===== 快捷鍵設定 Modal ===== */}
            <AnimatePresence>
                {showHotkeySettings && (
                    <HotkeySettingsModal hotkeys={hotkeys} onSave={async (newHk) => {
                        if (isElectron) {
                            const result = await window.electronAPI.setHotkeys(newHk);
                            setHotkeys(result);
                        } else {
                            setHotkeys(newHk);
                        }
                        setShowHotkeySettings(false);
                        toast(isElectron ? '快捷鍵已更新' : '快捷鍵顯示已更新，Electron 版才會註冊全域快捷鍵');
                    }} onClose={() => setShowHotkeySettings(false)} dark={dark} />
                )}
            </AnimatePresence>

            <Toast message={toastMsg} visible={toastVisible} />
        </div>
    );
};

export default App;
