/**
 * Converts Romaji string to Hiragana.
 * Handles basic mappings and some common variations.
 * Note: This is a basic implementation. For production use, consider a library like 'wanakana'.
 * 
 * @param {string} romaji - The romaji string to convert.
 * @returns {string} - The converted hiragana string.
 */
export const convertRomajiToHiragana = (romaji) => {
    if (!romaji) return '';

    let result = romaji.toLowerCase();

    // Sort keys by length descending to handle 'shi' before 'si', 'tsu' before 'tu', etc.
    const mapping = {
        'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
        'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
        'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
        'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
        'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
        'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
        'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
        'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
        'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
        'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
        'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',

        'shi': 'し', 'chi': 'ち', 'tsu': 'つ',

        'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
        'sa': 'さ', 'si': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
        'ta': 'た', 'ti': 'ち', 'tu': 'つ', 'te': 'て', 'to': 'と',
        'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
        'ha': 'は', 'hi': 'ひ', 'hu': 'ふ', 'he': 'へ', 'ho': 'ほ',
        'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
        'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
        'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
        'wa': 'わ', 'wo': 'を', 'nn': 'ん',

        'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
        'za': 'ざ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
        'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
        'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
        'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',

        'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
        'n': 'ん', '-': 'ー'
    };

    // Special handling for small tsu (double consonants)
    // e.g., 'kko' -> 'っこ', 'ssho' -> 'っしょ'
    result = result.replace(/([kstnhmyrwgzbdp])\1/g, 'っ$1');

    // Apply mapping
    // We iterate through keys sorted by length to match longest patterns first
    const keys = Object.keys(mapping).sort((a, b) => b.length - a.length);

    for (const key of keys) {
        const regex = new RegExp(key, 'g');
        result = result.replace(regex, mapping[key]);
    }

    return result;
};
