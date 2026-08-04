# SLACK STEPS アプリ仕様書

最終更新日: 2026-07-17

この資料は、SLACK STEPSの現在の実装仕様をすぐ確認できるようにまとめたものです。
仕様変更や機能追加を行う場合は、コードと同じタイミングでこの資料も更新します。

## 1. アプリ概要

SLACK STEPSは、スラックライン初心者の成長を見える化するデジタル検定・学習サポートPWAです。

生徒は技のお手本やポイントを確認して練習し、先生の確認後に承認QRを読み取ることで、端末内へクリア記録を保存します。

### 主な利用者

- 生徒・初心者: 技の確認、QR読み取り、進捗確認
- 先生・インストラクター: PIN認証、技ごとの承認QR表示
- 保護者: 生徒端末を通じた成長状況の確認
- 管理者: 公開クリア者一覧の手動管理

## 2. 技術構成

- React 18
- TypeScript
- Vite
- Tailwind CSS
- 独自CSS（`src/index.css`）
- ZXing Browser（QRコード読み取り）
- qrcode.react（承認QR生成）
- localStorage（プロフィール・検定記録の保存）
- Google Apps Script JSON API（公開クリア者一覧）
- vite-plugin-pwa（PWA・Service Worker）
- GitHub Actions / GitHub Pages（ビルド・公開）

`@supabase/supabase-js`は依存関係に含まれていますが、現在のアプリコードでは使用していません。

## 3. 起動フロー

```text
アプリ起動
  ↓
スプラッシュ画面
  ↓
初回またはチュートリアル未完了？
  ├─ はい → チュートリアル（STEP 01〜04）→ HOME
  └─ いいえ → HOME
```

画面状態は`src/App.tsx`で管理します。

## 4. 画面構成

### フッターナビゲーション

| 画面 | ファイル | 主な役割 |
| --- | --- | --- |
| HOME | `src/screens/HomeScreen.tsx` | ランク選択、技一覧、進捗、技詳細、クリア演出 |
| SCAN | `src/screens/ScanScreen.tsx` | 端末カメラによる承認QRの読み取り |
| CHECK | `src/screens/CheckScreen.tsx` | 先生PIN認証、承認する技の選択、承認QR表示 |
| PROFILE | `src/screens/ProfileScreen.tsx` | ニックネーム・画像の保存、バックアップ、インポート |

### HOMEメニュー内の画面

| 画面 | ファイル | 主な役割 |
| --- | --- | --- |
| 使い方ガイド | `src/screens/GuideScreen.tsx` | アプリ利用手順とPWA追加方法の確認 |
| クリア者一覧 | `src/screens/ClearedUsersScreen.tsx` | GASから公開クリア者情報を取得・表示 |
| プライバシーポリシー | `src/screens/PrivacyScreen.tsx` | 保存データと端末機能利用の説明 |
| このアプリについて | `src/screens/AboutScreen.tsx` | アプリ概要、バージョン、監修者情報 |

### 起動時の画面

| 画面 | ファイル | 主な役割 |
| --- | --- | --- |
| スプラッシュ | `src/screens/SplashScreen.tsx` | ロゴ表示と起動演出 |
| 初回チュートリアル | `src/screens/TutorialScreen.tsx` | STEP 01〜04の利用案内 |

### START専用レイアウト

STARTタブはSTATIC／BOUNCEと異なる専用レイアウトを使用します。

- 進捗バーの下にSTART共通のお手本YouTube動画（ID: `fpVE_qwd4sQ`）を表示
- 動画の下に基本姿勢の案内コメントを表示
- コメントの下にSTARTの4技を2列で表示
- STARTでは級の概念を使用せず、技カード・技詳細・CHECK・承認QRに級を表示しない
- 技カードをタップしたときの技詳細モーダルは従来どおり表示

技詳細モーダルは画面下端に固定し、上端が画面上部から40pxの位置になる高さで表示します。モーダル内部は縦スクロールできます。

STATIC／BOUNCEの技一覧は1列で表示し、STARTの技一覧だけ2列で表示します。

### ランク別コメント画像

各ランクのSPEC表記部分には、次のコメント画像を表示します。

- START: `start-comment.svg`
- STATIC: `staticocomment.svg`
- BOUNCE: `bounce-comment.svg`

## 5. ランク・技データ

技のマスターデータは`src/data/skills.ts`で管理します。

| ランク | 技数 | 解放条件 |
| --- | ---: | --- |
| START | 4 | 常に解放 |
| STATIC | 10 | STARTの全技クリア |
| BOUNCE | 10 | STARTの全技クリア |

STATICの完了はBOUNCEの解放条件ではありません。

画面内の3文字省略表記は、STATICを`STA`、BOUNCEを`BOU`とします。

### START技一覧

| 番号 | 技名 |
| --- | --- |
| 04 | 基本姿勢(両足)10秒 |
| 03 | リカバリー(右足)10秒 |
| 02 | リカバリー(左足)10秒 |
| 01 | 逆スタンス(両足)10秒 |

### STATIC技一覧

| STEP | 技名 |
| --- | --- |
| STEP01 | ウォーク |
| STEP02 | ウォーク→スクワット→ウォーク |
| STEP03 | ドロップニー→フットプラント→クルック |
| STEP04 | ドロップニー→フロントブッダ→ダブルフットプラント→フロントブッダ⇨ドロップニー |
| STEP05 | バックウォーク |
| STEP06 | ドロップニー→クルック→ダブルドロップニー→クルック |
| STEP07 | インワード→ターン→ドロップニー→ターン→ドロップニー |
| STEP08 | モンキー→ワンフットグラブ→Lシット→ワンフットレバー |
| STEP09 | スタンド→サイドブッダ→サイドソール→サイドプランク→スクワット |
| STEP10 | モンキー→ガンビットスワップ→クルック |

### BOUNCE技一覧

| STEP | 技名 |
| --- | --- |
| STEP01 | フィート→バット→フィート |
| STEP02 | フィート→チェスト→フィート |
| STEP03 | フィート→バット180→バット→フィート |
| STEP04 | フィート→バット→レディ→スプレドル→バット→フィート |
| STEP05 | フィート→バット180→バット逆スピン180→バット180→チェスト→バット→フィート |
| STEP06 | フィート→バット→チェスト→モジョ→バット→フィート |
| STEP07 | フィート→バット180→フィート |
| STEP08 | フィート→バット180→クルック |
| STEP09 | フィート→バックバウンス→フィート |
| STEP10 | フィート→バット→ナスティチェスト→バット→フィート |

技名内の`→`／`⇨`は、画面上では青い`icn-technique-arrow.svg`へ置き換えて表示します。技名データとアクセシビリティ用ラベルには元の文字列を保持します。

各技は主に以下の情報を持ちます。

- ID
- ランク
- 表示レベル（STATIC／BOUNCEのSTEP。STARTでは表示しない）
- 技名
- 説明文
- 成功ポイント
- YouTube動画ID
- サムネイル画像
- 承認用QRコード文字列

`src/data/techniques.ts`が画面表示用の`Technique`形式へ変換します。

各技の名称・お手本動画・説明・ポイントは`src/slack-steps-skill.csv`を基準とし、`src/data/skills.ts`へ設定します。現在はSTARTとSTATICの説明・ポイントを反映済みです。

## 6. 検定・承認QRフロー

```text
生徒が技を練習
  ↓
先生が技を確認
  ↓
先生がCHECK画面へPIN入力
  ↓
合格した技を選択して承認QRを表示
  ↓
生徒がアプリ内のSCANでQRを読み取る
  ↓
QR文字列を技IDへ変換
  ↓
クリア済みIDをlocalStorageへ保存
  ↓
HOMEへ移動してNICEまたはCOMPLETEを表示
```

### 読み取り結果

- 有効な未クリアQR: クリア記録を追加
- ランク最後の未クリア技: ランクCOMPLETE演出
- クリア済みQR: 「すでにクリア済みです」と表示
- 無効なQR: 「このQRコードは無効です」と表示

STARTの全技をクリアすると、COMPLETE演出の後にSTATICとBOUNCEの解放案内を表示します。

ランク完了時の画像は次のファイルを使用します。

- START: `start-complete.webp`
- STATIC: `static-complete.webp`
- BOUNCE: `bounce-complete.webp`

## 7. 端末内データ

ユーザーのプロフィールと検定記録は、外部サーバーへ送信せず、利用端末のlocalStorageへ保存します。1台の端末に複数プロフィールを作成でき、選択中プロフィールを切り替えて利用します。

| localStorageキー | 内容 | バックアップ対象 |
| --- | --- | --- |
| `slackStepsProfiles` | 複数プロフィール、選択中ID、プロフィール別のニックネーム・画像・クリア済み技ID | 選択中プロフィールのみ対象 |
| `slackStepsTutorialCompleted` | 初回チュートリアル完了状態 | 対象外 |
| `slackStepsInstructorAuthorized` | 先生認証と有効期限 | 対象外 |
| `slackStepsRemoteAppConfig` | GASから取得したデバッグ設定のキャッシュ | 対象外 |
| `slackStepsClearedUsersCache` | GASから取得したクリア者一覧のキャッシュ | 対象外 |

各プロフィールは重複しない内部IDで識別します。ニックネームは表示名として扱い、同じ名前や未設定でもプロフィールを区別できます。プロフィールの追加・切り替え・削除はPROFILE画面から行います。最後の1件は削除できません。

旧保存形式の`slackStepsNickname`、`slackStepsProfileImage`、`slackStepsClearedSkills`があり、`slackStepsProfiles`が未作成の場合は、既存データを最初のプロフィールへ自動移行します。チュートリアル完了状態と先生認証はプロフィール別ではなく端末共通です。

### バックアップJSON

PROFILE画面から次の形式でエクスポートします。

```json
{
  "app": "SLACK STEPS",
  "version": "1.0.0",
  "exportedAt": "ISO 8601 date-time",
  "data": {
    "nickname": "string",
    "profileImage": "data URL or empty string",
    "clearedSkills": ["skill-id"]
  }
}
```

バックアップとインポートは選択中プロフィールのみを対象とします。インポート時は選択中プロフィールの名前・画像・クリア記録を上書きし、ほかのプロフィールには影響しません。

バックアップファイル名は端末のローカル日時を使い、ニックネーム設定済みの場合は`ユーザー名-bkup-YYYYmmddhhmm.json`、未設定の場合は`bkup-YYYYmmddhhmm.json`とします。ファイル名に使用できない記号は`_`へ置き換えます。

技IDはSTARTが`start-*`、STATICが`static-*`、BOUNCEが`bounce-*`です。このID体系へ切り替えた際、クリア記録は一度だけリセットします。旧IDを含むバックアップをインポートした場合、旧IDはクリア記録へ復元しません。

技サムネイルはランク内の番号と直接対応し、STARTが`start-thumb_番号.webp`、STATICが`static-thumb_STEP番号.webp`、BOUNCEが`bounce-thumb_STEP番号.webp`の形式です。例として、START01は`start-thumb_01.webp`、STATICのSTEP10は`static-thumb_10.webp`を参照します。

## 8. 先生認証

- PINはGoogleスプレッドシートの`settings`シートで管理
- 4桁の数字を入力
- アプリからGASへPINを送信し、GAS内で一致判定した結果だけを受信
- PIN自体は配信コードや設定取得APIへ含めない
- 認証状態はlocalStorageへ保存
- 認証の有効期間は24時間
- GASへ通信できない場合、新しい先生認証は行わない

認証済み状態は端末側で保持する実証実験向けの簡易認証であり、本格的なアクセス制御や機密情報の保護を目的としたものではありません。PINを変更しても、すでに認証済みの端末は最大24時間認証状態が継続します。

### デバッグ設定

- `settings`シートの`debug_enabled`を`TRUE`または`FALSE`にして管理
- アプリ起動時と画面へ戻った際にGASから最新設定を取得
- 取得成功時は端末内へ24時間キャッシュ
- 取得失敗時は有効期間内のキャッシュ値を継続使用
- ONの場合、CHECKのクリア操作・承認QRの読み取りテストとPROFILEのチュートリアル再表示を表示
- OFFの場合、これらのデバッグ操作を非表示

## 9. クリア者一覧と外部通信

`src/screens/ClearedUsersScreen.tsx`からGoogle Apps ScriptのJSON APIを読み取ります。先生PIN照合、デバッグ設定、クリア者一覧は同じGASウェブアプリを使用します。

受信する項目は次のとおりです。

- `name`: ニックネーム
- `date`: クリア年月
- `school`: 教室名
- `rank`: STATICまたはBOUNCE

旧データとの互換性のため、GASから受け取ったBEGINNERはSTATIC、ADVANCEDはBOUNCEとして読み替えます。

取得成功時はクリア者一覧を端末内へキャッシュします。次回表示時はキャッシュを即時表示し、裏側で最新データを取得して更新します。最新データの取得に失敗した場合は前回のキャッシュを維持し、キャッシュがない場合のみ画面確認用のサンプルデータを表示します。

アプリからGASへ送信する情報は、先生認証時の4桁のPINのみです。プロフィール、画像、検定記録をGASへ送信する処理はありません。公開クリア者情報は、本人または保護者の許可を得たうえで管理者が手動登録する運用を前提とします。

## 10. PWA仕様

PWA設定は`vite.config.ts`で管理します。

- アプリ名: SLACK STEPS
- 表示形式: standalone
- 公開ベースパス: `/slack-steps/`
- Service Worker: 自動更新
- Google Fonts: Cache First
- GASクリア者一覧: Network First
- GitHub Pagesの画面遷移用フォールバック設定あり
- iPhone用・通常PWA用・maskableアイコンあり

チュートリアルと使い方ガイドのSTEP 04には、iPhone／Android別のホーム画面追加手順があります。

## 11. デザイン・アニメーション

- Tailwind CSSを基本レイアウトに使用
- `src/index.css`にFigma調整用の個別CSSを配置
- スプラッシュとチュートリアルのフェード・スライド演出
- 画面切り替え時の短いフェード・移動演出
- カードとボタンの押下アニメーション
- モーダルのスライドアップ／表示アニメーション
- `prefers-reduced-motion`によるアニメーション抑制対応

モーダルと固定フッターの重なり順を変更する場合は、親要素のstacking contextも確認します。

## 12. デバッグ機能

デバッグ表示は`src/config/debug.ts`の次の値で切り替えます。

```ts
export const SHOW_DEBUG_CONTROLS = true;
```

有効時に表示される機能は次のとおりです。

- このランクを全クリアにする
- クリア状態をリセット
- 先生認証をリセット
- チュートリアルを再表示

承認QRモーダルの「読み取りテスト」は、現在デバッグフラグに関係なく表示されます。

## 13. デプロイ

- 公開先: GitHub Pages
- 対象ブランチ: `main`
- ワークフロー: `.github/workflows/deploy.yml`
- `main`へのpushで`npm ci`と`npm run build`を実行して公開
- 公開URL: `https://slacksteps.github.io/slack-steps/`

## 14. 現在の注意点・確認事項

- `SHOW_DEBUG_CONTROLS`は現在`true`
- BOUNCEの技名・説明・ポイントはプレースホルダー中心
- PROFILE内のSTA／BOU進捗は保存済みクリア記録と連動していない
- 承認QRの「読み取りテスト」は常時表示
- 先生PINはフロントエンドに固定された簡易認証
- `@supabase/supabase-js`は未使用
- `TutorialScreen.tsx`にFast Refresh関連のESLint警告が3件ある

## 15. 変更時の更新ルール

次の変更を行った場合は、この仕様書も同じ作業内で更新します。

- 画面の追加・削除・名称変更
- 画面遷移の変更
- 技・ランク・解放条件の変更
- QR承認フローの変更
- localStorageキーやバックアップ形式の変更
- 外部APIや送受信データの変更
- PWA、公開URL、デプロイ方法の変更
- デバッグ機能の追加・削除
- 「現在の注意点・確認事項」の解消または追加

更新時は冒頭の「最終更新日」も変更します。
