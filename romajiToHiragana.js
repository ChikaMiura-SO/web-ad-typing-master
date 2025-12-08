/**
 * ローマ字→ひらがな変換ユーティリティ
 * 
 * タイピングの表記揺れに対応するため、複数のローマ字入力パターンを考慮し、
 * ユーザー入力されたローマ字を正確なひらがなに変換します。
 * 
 * 例: "shi" → "し", "si" → "し", "chi" → "ち", "ti" → "ち"
 */

// ローマ字→ひらがな変換テーブル
// 長いパターンから順にマッチさせるため、変換時にソートして使用
const ROMAJI_TO_HIRAGANA_MAP = {
    // 拗音 (3文字)
    'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
    'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
    'sya': 'しゃ', 'syu': 'しゅ', 'syo': 'しょ',
    'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
    'tya': 'ちゃ', 'tyu': 'ちゅ', 'tyo': 'ちょ',
    'cya': 'ちゃ', 'cyu': 'ちゅ', 'cyo': 'ちょ',
    'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
    'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
    'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
    'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
    'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
    'jya': 'じゃ', 'jyu': 'じゅ', 'jyo': 'じょ',
    'zya': 'じゃ', 'zyu': 'じゅ', 'zyo': 'じょ',
    'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
    'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',

    // 拗音 (ja/ju/jo の別表記)
    'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',

    // ファ行
    'fa': 'ふぁ', 'fi': 'ふぃ', 'fu': 'ふ', 'fe': 'ふぇ', 'fo': 'ふぉ',
    'fya': 'ふゃ', 'fyu': 'ふゅ', 'fyo': 'ふょ',

    // ティ・ディ行
    'thi': 'てぃ', 'dhi': 'でぃ',

    // ウィ・ウェ・ウォ
    'wi': 'うぃ', 'we': 'うぇ', 'wo': 'を',

    // ヴ行
    'va': 'ゔぁ', 'vi': 'ゔぃ', 'vu': 'ゔ', 've': 'ゔぇ', 'vo': 'ゔぉ',

    // ツァ行
    'tsa': 'つぁ', 'tsi': 'つぃ', 'tse': 'つぇ', 'tso': 'つぉ',

    // 基本の2文字パターン
    'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
    'sa': 'さ', 'si': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
    'ta': 'た', 'ti': 'ち', 'tu': 'つ', 'te': 'て', 'to': 'と',
    'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
    'ha': 'は', 'hi': 'ひ', 'hu': 'ふ', 'he': 'へ', 'ho': 'ほ',
    'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
    'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
    'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
    'wa': 'わ',
    'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
    'za': 'ざ', 'zi': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
    'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
    'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
    'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',

    // 表記揺れ対応 (shi, chi, tsu, fu)
    'shi': 'し', 'chi': 'ち', 'tsu': 'つ',

    // じ の別表記
    'ji': 'じ',

    // づ の別表記
    'dzu': 'づ',

    // ん (n + 母音以外 or nn)
    'nn': 'ん', "n'": 'ん',

    // 小文字 (lやxで始まる)
    'la': 'ぁ', 'li': 'ぃ', 'lu': 'ぅ', 'le': 'ぇ', 'lo': 'ぉ',
    'xa': 'ぁ', 'xi': 'ぃ', 'xu': 'ぅ', 'xe': 'ぇ', 'xo': 'ぉ',
    'lya': 'ゃ', 'lyu': 'ゅ', 'lyo': 'ょ',
    'xya': 'ゃ', 'xyu': 'ゅ', 'xyo': 'ょ',
    'ltu': 'っ', 'ltsu': 'っ', 'xtu': 'っ', 'xtsu': 'っ',
    'lwa': 'ゎ', 'xwa': 'ゎ',

    // 単独母音
    'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',

    // ん (単独n - 末尾や子音の前)
    'n': 'ん',

    // 記号
    '-': 'ー',
};

// 促音処理のための子音セット (これらの文字が連続すると「っ」になる)
const CONSONANTS_FOR_SOKUON = new Set([
    'k', 's', 't', 'h', 'f', 'm', 'r', 'w', 'g', 'z', 'd', 'b', 'p', 'j', 'c', 'v'
]);

/**
 * ローマ字をひらがなに変換
 * @param {string} romaji - 変換するローマ字文字列
 * @returns {string} ひらがな文字列
 */
function romajiToHiragana(romaji) {
    if (!romaji || typeof romaji !== 'string') {
        return '';
    }

    const input = romaji.toLowerCase();
    let result = '';
    let i = 0;

    while (i < input.length) {
        let matched = false;

        // 促音処理: 同じ子音が連続している場合 (例: kk → っk)
        if (i < input.length - 1) {
            const currentChar = input[i];
            const nextChar = input[i + 1];

            if (CONSONANTS_FOR_SOKUON.has(currentChar) &&
                currentChar === nextChar &&
                currentChar !== 'n') {
                result += 'っ';
                i++;
                continue;
            }
        }

        // 長いパターンから優先的にマッチ (4文字→3文字→2文字→1文字)
        for (let len = 4; len >= 1; len--) {
            if (i + len <= input.length) {
                const substr = input.substring(i, i + len);

                // 'n' の特殊処理: 次の文字が母音や'y'の場合は単独の'n'として扱わない
                if (len === 1 && substr === 'n' && i + 1 < input.length) {
                    const nextChar = input[i + 1];
                    if ('aiueoyny'.includes(nextChar)) {
                        continue; // この'n'は次の文字と組み合わせる
                    }
                }

                if (ROMAJI_TO_HIRAGANA_MAP[substr]) {
                    result += ROMAJI_TO_HIRAGANA_MAP[substr];
                    i += len;
                    matched = true;
                    break;
                }
            }
        }

        // マッチしない場合はそのまま追加
        if (!matched) {
            result += input[i];
            i++;
        }
    }

    return result;
}

/**
 * あるひらがなに対して、有効なローマ字入力パターンのリストを取得
 * タイピングゲームで入力検証に使用
 * @param {string} hiragana - 対象のひらがな
 * @returns {string[]} 有効なローマ字パターンの配列
 */
function getValidRomajiPatterns(hiragana) {
    const patterns = [];

    for (const [romaji, kana] of Object.entries(ROMAJI_TO_HIRAGANA_MAP)) {
        if (kana === hiragana) {
            patterns.push(romaji);
        }
    }

    return patterns;
}

/**
 * ひらがな文字列に対して、すべての有効なローマ字入力パターンを生成
 * @param {string} hiraganaStr - ひらがな文字列
 * @returns {string[][]} 各文字位置での有効なローマ字パターンの配列
 */
function getAllValidPatterns(hiraganaStr) {
    const result = [];
    let i = 0;

    while (i < hiraganaStr.length) {
        // 2文字の拗音をチェック (きゃ、しゃ など)
        if (i + 1 < hiraganaStr.length) {
            const twoChars = hiraganaStr.substring(i, i + 2);
            const patterns = getValidRomajiPatterns(twoChars);
            if (patterns.length > 0) {
                result.push({ hiragana: twoChars, patterns: patterns });
                i += 2;
                continue;
            }
        }

        // 1文字をチェック
        const oneChar = hiraganaStr[i];
        const patterns = getValidRomajiPatterns(oneChar);
        if (patterns.length > 0) {
            result.push({ hiragana: oneChar, patterns: patterns });
        } else {
            // マッチしない場合 (カタカナや記号など)
            result.push({ hiragana: oneChar, patterns: [oneChar] });
        }
        i++;
    }

    return result;
}

/**
 * ユーザー入力が、期待されるひらがなに対して有効かどうかを検証
 * @param {string} userInput - ユーザーが入力したローマ字
 * @param {string} expectedHiragana - 期待されるひらがな
 * @returns {boolean} 有効な入力かどうか
 */
function isValidRomajiInput(userInput, expectedHiragana) {
    const converted = romajiToHiragana(userInput);
    return converted === expectedHiragana;
}

/**
 * 入力中のローマ字が、期待されるひらがなの部分入力として有効かどうかをチェック
 * @param {string} partialInput - 部分的なローマ字入力
 * @param {string} expectedHiragana - 期待されるひらがな
 * @returns {boolean} 有効な部分入力かどうか
 */
function isValidPartialInput(partialInput, expectedHiragana) {
    if (!partialInput) return true;

    // 完全なひらがなに変換できる部分をチェック
    const patterns = getAllValidPatterns(expectedHiragana);
    let currentInput = partialInput.toLowerCase();

    for (const { patterns: validPatterns } of patterns) {
        if (!currentInput) break;

        let matched = false;
        for (const pattern of validPatterns) {
            // 完全一致
            if (currentInput.startsWith(pattern)) {
                currentInput = currentInput.substring(pattern.length);
                matched = true;
                break;
            }
            // 部分一致 (入力途中)
            if (pattern.startsWith(currentInput)) {
                return true;
            }
        }

        if (!matched && currentInput) {
            // どのパターンにもマッチしない
            return false;
        }
    }

    return true;
}

// エクスポート (ES6モジュール用とグローバル用の両対応)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        romajiToHiragana,
        getValidRomajiPatterns,
        getAllValidPatterns,
        isValidRomajiInput,
        isValidPartialInput,
        ROMAJI_TO_HIRAGANA_MAP
    };
}

// グローバルスコープへの公開 (ブラウザ用)
if (typeof window !== 'undefined') {
    window.RomajiUtils = {
        romajiToHiragana,
        getValidRomajiPatterns,
        getAllValidPatterns,
        isValidRomajiInput,
        isValidPartialInput,
        ROMAJI_TO_HIRAGANA_MAP
    };
}
