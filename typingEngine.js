/**
 * タイピングエンジン - ひらがなベースの入力判定
 * 
 * ひらがなから有効なローマ字パターンを生成し、
 * 表記揺れ（shi/si、chi/ti 等）に対応した入力判定を行う
 */

// ひらがな→ローマ字変換マップ（複数パターン対応）
const HIRAGANA_TO_ROMAJI_MAP = {
    // 拗音（2文字）
    'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'],
    'しゃ': ['sha', 'sya'], 'しゅ': ['shu', 'syu'], 'しょ': ['sho', 'syo'],
    'ちゃ': ['cha', 'tya', 'cya'], 'ちゅ': ['chu', 'tyu', 'cyu'], 'ちょ': ['cho', 'tyo', 'cyo'],
    'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
    'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
    'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
    'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],
    'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
    'じゃ': ['ja', 'jya', 'zya'], 'じゅ': ['ju', 'jyu', 'zyu'], 'じょ': ['jo', 'jyo', 'zyo'],
    'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
    'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],
    'ふぁ': ['fa'], 'ふぃ': ['fi'], 'ふぇ': ['fe'], 'ふぉ': ['fo'],
    'てぃ': ['thi', 'ti'], 'でぃ': ['dhi', 'di'],
    'うぃ': ['wi'], 'うぇ': ['we'],

    // 基本（1文字）
    'あ': ['a'], 'い': ['i'], 'う': ['u'], 'え': ['e'], 'お': ['o'],
    'か': ['ka'], 'き': ['ki'], 'く': ['ku'], 'け': ['ke'], 'こ': ['ko'],
    'さ': ['sa'], 'し': ['si', 'shi'], 'す': ['su'], 'せ': ['se'], 'そ': ['so'],
    'た': ['ta'], 'ち': ['ti', 'chi'], 'つ': ['tu', 'tsu'], 'て': ['te'], 'と': ['to'],
    'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
    'は': ['ha'], 'ひ': ['hi'], 'ふ': ['hu', 'fu'], 'へ': ['he'], 'ほ': ['ho'],
    'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
    'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
    'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
    'わ': ['wa'], 'を': ['wo'], 'ん': ['nn', "n'"],
    'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
    'ざ': ['za'], 'じ': ['zi', 'ji'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
    'だ': ['da'], 'ぢ': ['di'], 'づ': ['du', 'dzu'], 'で': ['de'], 'ど': ['do'],
    'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
    'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],

    // 小文字
    'ぁ': ['xa', 'la'], 'ぃ': ['xi', 'li'], 'ぅ': ['xu', 'lu'], 'ぇ': ['xe', 'le'], 'ぉ': ['xo', 'lo'],
    'ゃ': ['xya', 'lya'], 'ゅ': ['xyu', 'lyu'], 'ょ': ['xyo', 'lyo'],
    'っ': ['xtu', 'ltu', 'xtsu', 'ltsu'],

    // 記号
    'ー': ['-'],
};

// 「ん」の特殊処理用（次の文字が母音や「や」行の場合は nn が必要）
const VOWELS_AND_Y = new Set(['a', 'i', 'u', 'e', 'o', 'y', 'n']);

// 促音の前に来れる子音
const CONSONANTS_FOR_SOKUON = new Set(['k', 's', 't', 'h', 'f', 'm', 'r', 'w', 'g', 'z', 'd', 'b', 'p', 'j', 'c', 'v']);

/**
 * ひらがな文字列を解析し、タイピング状態オブジェクトを生成
 * @param {string} hiragana - ひらがな文字列
 * @returns {object} タイピング状態オブジェクト
 */
function generateTypingState(hiragana) {
    const segments = [];
    let i = 0;

    while (i < hiragana.length) {
        // 促音（っ）の処理
        if (hiragana[i] === 'っ' && i + 1 < hiragana.length) {
            // 次の文字を取得して処理
            let nextChar = hiragana[i + 1];
            let nextNextChar = i + 2 < hiragana.length ? hiragana[i + 2] : '';

            // 次が2文字の拗音かチェック
            const twoChars = nextChar + nextNextChar;
            if (HIRAGANA_TO_ROMAJI_MAP[twoChars]) {
                const patterns = HIRAGANA_TO_ROMAJI_MAP[twoChars];
                const sokuonPatterns = patterns.map(p => p[0] + p); // 子音を重ねる
                segments.push({
                    hiragana: 'っ' + twoChars,
                    patterns: sokuonPatterns,
                    primary: sokuonPatterns[0]
                });
                i += 3;
                continue;
            }

            // 次が1文字
            if (HIRAGANA_TO_ROMAJI_MAP[nextChar]) {
                const patterns = HIRAGANA_TO_ROMAJI_MAP[nextChar];
                const sokuonPatterns = patterns.map(p => p[0] + p); // 子音を重ねる
                segments.push({
                    hiragana: 'っ' + nextChar,
                    patterns: sokuonPatterns,
                    primary: sokuonPatterns[0]
                });
                i += 2;
                continue;
            }
        }

        // 2文字の拗音をチェック
        if (i + 1 < hiragana.length) {
            const twoChars = hiragana.substring(i, i + 2);
            if (HIRAGANA_TO_ROMAJI_MAP[twoChars]) {
                const patterns = HIRAGANA_TO_ROMAJI_MAP[twoChars];
                segments.push({
                    hiragana: twoChars,
                    patterns: patterns,
                    primary: patterns[0]
                });
                i += 2;
                continue;
            }
        }

        // 1文字をチェック
        const oneChar = hiragana[i];
        if (HIRAGANA_TO_ROMAJI_MAP[oneChar]) {
            const patterns = HIRAGANA_TO_ROMAJI_MAP[oneChar].slice(); // コピー

            // 「ん」の特殊処理
            if (oneChar === 'ん') {
                const nextChar = i + 1 < hiragana.length ? hiragana[i + 1] : '';
                const nextRomaji = HIRAGANA_TO_ROMAJI_MAP[nextChar];

                // 常に nn も許可（n' は削除し、n と nn のみにする）
                if (nextRomaji && nextRomaji.length > 0) {
                    const nextFirstChar = nextRomaji[0][0];
                    if (VOWELS_AND_Y.has(nextFirstChar)) {
                        // 次の文字が母音や「や」行で始まる場合
                        // nn のみ許可（n 単独だと次の文字と混同する）
                        // patterns は ['nn', "n'"] だが、n' を除いて nn のみにする
                        patterns.length = 0;
                        patterns.push('nn');
                    } else {
                        // 次が子音で始まる場合、n と nn の両方を許可
                        patterns.length = 0;
                        patterns.push('n', 'nn');
                    }
                } else {
                    // 末尾の「ん」は n と nn の両方を許可
                    patterns.length = 0;
                    patterns.push('n', 'nn');
                }
            }

            segments.push({
                hiragana: oneChar,
                patterns: patterns,
                primary: patterns[0]
            });
        } else {
            // マッチしない場合（記号など）
            segments.push({
                hiragana: oneChar,
                patterns: [oneChar],
                primary: oneChar
            });
        }
        i++;
    }

    return {
        segments: segments,
        currentSegmentIndex: 0,
        currentInput: '',
        completedRomaji: ''
    };
}

/**
 * キー入力を処理
 * @param {object} state - タイピング状態
 * @param {string} key - 入力されたキー
 * @returns {object} { isCorrect, isSegmentComplete, isWordComplete, newState }
 */
function processKeyInput(state, key) {
    if (state.currentSegmentIndex >= state.segments.length) {
        return { isCorrect: false, isSegmentComplete: false, isWordComplete: true, newState: state };
    }

    const segment = state.segments[state.currentSegmentIndex];
    const testInput = state.currentInput + key.toLowerCase();

    // 「ん」の特殊処理: 'n' が入力済みで、'nn' も有効パターンの場合
    // 次のキーが 'n' 以外なら、'n' でセグメント完了して次セグメントの処理も行う
    if (state.currentInput === 'n' && segment.patterns.includes('n') && segment.patterns.includes('nn')) {
        if (key.toLowerCase() === 'n') {
            // 'nn' で完了
            const newState = {
                ...state,
                currentSegmentIndex: state.currentSegmentIndex + 1,
                currentInput: '',
                completedRomaji: state.completedRomaji + 'nn'
            };
            const isWordComplete = newState.currentSegmentIndex >= state.segments.length;
            return { isCorrect: true, isSegmentComplete: true, isWordComplete, newState };
        } else {
            // 'n' で完了し、次のセグメントに対してキーを処理
            const intermediateState = {
                ...state,
                currentSegmentIndex: state.currentSegmentIndex + 1,
                currentInput: '',
                completedRomaji: state.completedRomaji + 'n'
            };

            // 次のセグメントが存在するか確認
            if (intermediateState.currentSegmentIndex >= state.segments.length) {
                // 単語完了、でも追加のキーは不正解
                return { isCorrect: false, isSegmentComplete: true, isWordComplete: true, newState: intermediateState };
            }

            // 次のセグメントに対してキーを処理
            return processKeyInput(intermediateState, key);
        }
    }

    // 完全一致チェック（ただし 'n' と 'nn' が両方有効な場合は 'n' で即完了しない）
    for (const pattern of segment.patterns) {
        if (pattern === testInput) {
            // 'n' でかつ 'nn' も有効パターンの場合は、まだ完了しない
            if (testInput === 'n' && segment.patterns.includes('nn')) {
                const newState = {
                    ...state,
                    currentInput: testInput
                };
                return { isCorrect: true, isSegmentComplete: false, isWordComplete: false, newState };
            }

            // セグメント完了
            const newState = {
                ...state,
                currentSegmentIndex: state.currentSegmentIndex + 1,
                currentInput: '',
                completedRomaji: state.completedRomaji + pattern
            };
            const isWordComplete = newState.currentSegmentIndex >= state.segments.length;
            return { isCorrect: true, isSegmentComplete: true, isWordComplete, newState };
        }
    }

    // 部分一致チェック（入力途中）
    for (const pattern of segment.patterns) {
        if (pattern.startsWith(testInput)) {
            const newState = {
                ...state,
                currentInput: testInput
            };
            return { isCorrect: true, isSegmentComplete: false, isWordComplete: false, newState };
        }
    }

    // 不正解
    return { isCorrect: false, isSegmentComplete: false, isWordComplete: false, newState: state };
}

/**
 * 表示用のローマ字文字列を生成
 * @param {object} state - タイピング状態
 * @returns {object} { completed, current, remaining }
 */
function getDisplayRomaji(state) {
    let completed = state.completedRomaji;
    let current = '';
    let remaining = '';

    if (state.currentSegmentIndex < state.segments.length) {
        const currentSegment = state.segments[state.currentSegmentIndex];
        const primary = currentSegment.primary;

        // 入力済みの部分
        current = state.currentInput;
        // 残りの部分（プライマリパターンから）
        remaining = primary.substring(state.currentInput.length);

        // 残りのセグメント
        for (let i = state.currentSegmentIndex + 1; i < state.segments.length; i++) {
            remaining += state.segments[i].primary;
        }
    }

    return { completed, current, remaining };
}

/**
 * 全体のローマ字文字列を取得（プライマリパターンのみ）
 * @param {object} state - タイピング状態
 * @returns {string} ローマ字文字列
 */
function getFullRomaji(state) {
    return state.segments.map(s => s.primary).join('');
}

// グローバルスコープへの公開
if (typeof window !== 'undefined') {
    window.TypingEngine = {
        generateTypingState,
        processKeyInput,
        getDisplayRomaji,
        getFullRomaji,
        HIRAGANA_TO_ROMAJI_MAP
    };
}
