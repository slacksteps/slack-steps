# SLACK STEPS

SLACK STEPSは、スラックライン初心者の上達を可視化するためのPWAプロトタイプです。

現在の画面構成・データ保存・検定フローなどの実装仕様は、[`docs/APP_SPEC.md`](docs/APP_SPEC.md)を参照してください。仕様変更時はコードとあわせて更新します。

初心者が段階的に技をクリアしていき、先生・インストラクターがQRコードで承認することで、リアルな教室やコミュニティと連動した検定体験を作ることを目的としています。

## Tech Stack

- React
- Vite
- Tailwind CSS
- localStorage
- Google Apps Script JSON API

## Main Features

- HOME画面
- PROFILE画面
- CHECK画面
- 先生PIN認証
- 承認QR表示
- クリア状態の保存
- START / STATIC / BOUNCE のランク管理
- ランクロック / 解放
- NICE / COMPLETE演出
- スプラッシュ画面
- 初回チュートリアル
- 使い方ガイド
- プライバシーポリシー
- このアプリについて
- クリア者一覧
- Googleスプレッドシート連携によるクリア者一覧表示
- JSONバックアップ / インポート

## localStorage Keys

- `slackStepsNickname`
- `slackStepsProfileImage`
- `slackStepsClearedSkills`
- `slackStepsTutorialCompleted`
- `slackStepsInstructorAuthorized`

## Important Rules

- `slackStepsNickname`, `slackStepsProfileImage`, `slackStepsClearedSkills` はユーザー記録データ。
- `slackStepsTutorialCompleted` は端末ごとの表示状態なので、バックアップ / インポート対象外。
- `slackStepsInstructorAuthorized` は先生認証の一時状態なので、バックアップ / インポート対象外。
- STARTは常に解放。
- STATICとBOUNCEは、STARTをすべてクリアしたら解放。
- STATIC完了はBOUNCE解放条件ではない。
- CHECK画面はランクロックの影響を受けない。
- COMPLETEモーダル画像にはテキストが含まれているため、HTMLで文字を重ねない。

## Current Status

主要機能は実装済み。

次のフェーズは、デザイン調整、CSS整理、不要なdebugボタン整理、PWA設定、iPhone実機確認。

## Do Not Break

- HOMEのクリア状態反映
- CHECKの先生認証
- QR承認テストフロー
- ランク解放ロジック
- localStorageキー名
- バックアップ / インポートJSON形式
- クリア者一覧のGoogle Apps Script JSON取得
