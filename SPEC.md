# Web Ad Typing Master - 実装済み仕様書

## 概要

Web広告関連用語のタイピング練習ゲーム。制限時間内にローマ字でタイピングし、スコアを競う。管理画面から問題の追加・編集・削除、CSV インポート/エクスポートが可能。

---

## 1. タイピングゲーム（フロントエンド）

### 1.1 画面構成

| 画面 | ファイル | 説明 |
|------|---------|------|
| カテゴリ選択画面 | `game.html` | ゲーム開始時に表示。カテゴリを選択 |
| 難易度選択画面 | `game.html` | カテゴリ選択後に表示。レベル(1〜3)を選択 |
| ゲーム画面 | `game.html` | タイピング中のメイン画面 |
| リザルト画面 | `game.html` | ゲーム終了後に表示。スコアと統計情報を表示 |

### 1.2 ゲームフロー

1. **カテゴリ選択**
   - 「Webマーケティング用語」（`marketing`）
   - 「コンプライアンス」（`compliance`）

2. **難易度選択**
   - 初級（Level 1）
   - 中級（Level 2）
   - 上級（Level 3）

3. **ゲームプレイ**
   - 制限時間: **60秒**
   - 問題は `questions.json` から取得（カテゴリ + レベルでフィルタリング）
   - 問題順: ランダムシャッフル
   - 問題が尽きた場合は再シャッフルして再出題

4. **スコアリング**
   - 正解タイプ: **+10点**
   - 単語完了ボーナス: **+50点**
   - ミスタイプ: 減点なし（統計のみ記録）

### 1.3 入力・表示仕様

- **用語表示**: 日本語の用語名（例: 「ユニークユーザー」）
- **ローマ字表示**: タイプすべきローマ字（例: `yuni-kuyu-za-`）
- **入力済み文字**: 緑色で表示
- **次の入力文字**: オレンジ色 + 下線で強調表示

### 1.4 フィードバック

- **正解時**
  - タイプ音（`sounds/typing_tap.mp3`）
  - スコアがフラッシュアニメーション
- **ミス時**
  - ミス音（`sounds/miss_sound.mp3`）
  - 入力エリアが振動（シェイクアニメーション）
  - ボーダーが赤く点滅
- **単語完了時**
  - 完了音（`sounds/word_complete.mp3`）
  - 入力エリアが緑にフラッシュ
- **ゲーム終了時**
  - 終了音（`sounds/game_finish.mp3`）

### 1.5 リザルト画面

- **最終スコア表示**
- **得意なキー (Top 3)**: 正答率が高いキーを表示（5回以上タイプしたキーが対象）
- **苦手なキー (Top 3)**: ミス回数が多いキーを表示
- **用語解説**: 完了した問題の用語と解説をリスト表示
- **PLAY AGAIN ボタン**: カテゴリ選択画面に戻る

### 1.6 プログレスバー

- 残り時間を視覚的に表示
- 残り5秒以下で赤色に変化

---

## 2. 問題データ構造

### 2.1 ファイル

- **ローカル**: `questions.json`
- **Firestore**: `problems` コレクション

### 2.2 データスキーマ

```json
{
  "id": 1,
  "term": "ユニークユーザー",
  "roman": "yuni-kuyu-za-",
  "explanation": "特定の期間内にサイトを訪問した人数。（UU）",
  "category": "marketing",
  "level": 1
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|------|-----|------|
| `id` | number | ✓ | 問題ID |
| `term` | string | ✓ | 日本語の用語名 |
| `roman` | string | ✓ | タイピング対象のローマ字 |
| `explanation` | string | ✓ | 用語の解説 |
| `category` | string | - | カテゴリ（`marketing` または `compliance`）。省略時は `marketing` |
| `level` | number | ✓ | 難易度（1〜3） |

### 2.3 現在の問題数

- **marketing**: 60問（レベル1: 20問、レベル2: 20問、レベル3: 20問）
- **compliance**: 20問（各レベルに分散）

---

## 3. 管理画面（React + Vite）

### 3.1 技術スタック

- **フレームワーク**: React 18 + Vite
- **ルーティング**: React Router DOM
- **認証**: Firebase Authentication
- **データベース**: Firebase Firestore
- **CSV処理**: Papa Parse

### 3.2 ルーティング

| パス | コンポーネント | 認証要否 |
|------|--------------|---------|
| `/` | → `/admin` にリダイレクト | - |
| `/login` | `Login` | 不要 |
| `/admin` | `AdminDashboard` | **必要** |

### 3.3 認証・認可

- **認証方式**: Firebase Email/Password 認証
- **管理者判定**: Firebase Custom Claims（`role === 'admin'`）
- **非管理者アクセス**: 自動ログアウト + ログイン画面にリダイレクト

### 3.4 管理者権限の付与

- **スクリプト**: `setAdminClaim.js`
- **実行方法**: 
  ```bash
  ADMIN_UID=<管理者のFirebase UID> node setAdminClaim.js
  ```
- **前提**: `serviceAccountKey.json`（Firebase サービスアカウントキー）が必要

### 3.5 AdminDashboard 機能

#### 3.5.1 Problem List（問題一覧）

- Firestore `problems` コレクションから取得
- **フィルタリング機能**
  - コース（Course ID）でフィルタ
  - レベル（Level ID）でフィルタ
- **一括削除機能**
  - チェックボックスで複数選択
  - 全選択/全解除
  - バッチ削除（Firestore writeBatch 使用）
- **個別操作**
  - Edit ボタン: 編集フォームを開く
  - Delete ボタン: 個別削除（確認ダイアログあり）

#### 3.5.2 Problem Form（問題追加/編集）

- **入力フィールド**
  - Course ID（ドロップダウン: `marketing` / `compliance`）
  - Level ID（ドロップダウン: `1` / `2` / `3`）
  - Question ID（ユニーク、編集時は変更不可）
  - Term（Question Text）
  - Reading（Correct Answer）
  - Explanation（任意）
- **バリデーション**
  - 必須項目チェック
  - 外部リンク（http/https）禁止
  - 新規作成時の重複 ID チェック
- **保存時**
  - 新規: `setDoc` で作成（`createdAt` タイムスタンプ追加）
  - 更新: `updateDoc` で更新（`updatedAt` タイムスタンプ更新）

#### 3.5.3 CSV Manager（インポート/エクスポート）

**インポート機能**
- CSV ファイル選択
- Papa Parse でパース
- バリデーション
  - 必須フィールドチェック
  - 外部リンク禁止
  - ファイル内重複 ID チェック
- Firestore バッチ更新（500件ずつ）
- ログ表示（成功/エラー）

**エクスポート機能**
- Firestore から全件取得
- CSV 形式でダウンロード
- ファイル名: `problems_export_<日付>.csv`

**CSVヘッダー**
```
course_id,level_id,question_id,question_text,correct_answer,explanation
```

---

## 4. ローマ字→ひらがな変換ユーティリティ

### 4.1 ファイル

- `romajiToHiragana.js`

### 4.2 主要機能

| 関数名 | 説明 |
|--------|------|
| `romajiToHiragana(romaji)` | ローマ字文字列をひらがなに変換 |
| `getValidRomajiPatterns(hiragana)` | 特定のひらがなに対する有効なローマ字パターンを取得 |
| `getAllValidPatterns(hiraganaStr)` | ひらがな文字列の全有効パターンを取得 |
| `isValidRomajiInput(userInput, expectedHiragana)` | 入力が期待されるひらがなと一致するか検証 |
| `isValidPartialInput(partialInput, expectedHiragana)` | 部分入力が有効かどうかを検証 |

### 4.3 対応パターン

- 基本母音・子音
- 拗音（きゃ、しゃ、ちゃ 等）
- 表記揺れ対応
  - `shi` / `si` → し
  - `chi` / `ti` → ち
  - `tsu` / `tu` → つ
  - `fu` / `hu` → ふ
- 促音処理（`kk` → っk 等）
- 小文字（`ltu` / `xtu` → っ 等）

---

## 5. デザイン・スタイル

### 5.1 カラーパレット

| 変数名 | 値 | 用途 |
|-------|-----|------|
| `--bg-color` | `#0f172a` | 背景色（ダークネイビー） |
| `--text-color` | `#f8fafc` | テキスト色（白） |
| `--primary-color` | `#3b82f6` | プライマリ（青） |
| `--secondary-color` | `#8b5cf6` | セカンダリ（紫） |
| `--accent-color` | `#06b6d4` | アクセント（シアン） |
| `--error-color` | `#ef4444` | エラー（赤） |
| `--success-color` | `#22c55e` | 成功（緑） |

### 5.2 デザイン特徴

- **グラスモーフィズム**: 背景ブラー + 半透明
- **グラデーション**: ボタンやタイトルに使用
- **アニメーション**
  - 画面遷移（フェード + スケール）
  - スコアフラッシュ
  - エリアフラッシュ（緑）
  - シェイクアニメーション（ミス時）
- **フォント**: Inter + Noto Sans JP

---

## 6. Firebase 設定

### 6.1 環境変数（`.env`）

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 6.2 使用サービス

- **Authentication**: Email/Password 認証
- **Firestore**: `problems` コレクション

---

## 7. ファイル構成

```
/
├── game.html              # ゲーム画面
├── script.js              # ゲームロジック
├── style.css              # ゲームスタイル
├── questions.json         # ローカル問題データ
├── romajiToHiragana.js    # ローマ字変換ユーティリティ
├── setAdminClaim.js       # 管理者権限付与スクリプト
├── serviceAccountKey.json # Firebase サービスアカウントキー（Git管理外）
├── sounds/                # 効果音
│   ├── typing_tap.mp3
│   ├── miss_sound.mp3
│   ├── word_complete.mp3
│   └── game_finish.mp3
├── src/                   # React 管理画面
│   ├── App.jsx            # ルーティング
│   ├── main.jsx           # エントリーポイント
│   ├── firebase.js        # Firebase 初期化
│   ├── index.css          # 管理画面スタイル
│   ├── components/
│   │   ├── Auth/
│   │   │   └── Login.jsx
│   │   └── Admin/
│   │       ├── AdminDashboard.jsx
│   │       ├── ProblemList.jsx
│   │       ├── ProblemForm.jsx
│   │       └── CSVManager.jsx
│   └── utils/
├── index.html             # 管理画面エントリー
├── vite.config.js         # Vite 設定
├── package.json           # 依存関係
└── .env                   # 環境変数
```

---

## 8. 開発・実行コマンド

```bash
# 開発サーバー起動（管理画面）
npm run dev

# ビルド
npm run build

# 管理者権限付与
ADMIN_UID=<UID> node setAdminClaim.js
```

---

## 9. 今後の検討事項（未実装）

- [ ] ゲーム画面の Firebase 連携（問題を Firestore から取得）
- [ ] ローマ字変換ユーティリティのゲームへの統合（表記揺れ対応）
- [ ] ユーザースコアのランキング機能
- [ ] 問題の公開/非公開フラグ
- [ ] ゲーム設定（制限時間のカスタマイズ等）
