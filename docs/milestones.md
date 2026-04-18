# Milestones

各マイルストーンは 1-2 セッション（1 セッション 90 分目安）で完了できるサイズを想定。

---

## M0: リポジトリとドキュメント整備

- [x] リポジトリ作成（GitHub）
- [x] ドキュメント整備（README, AGENTS.md, milestones）

## M1: Python プロジェクト初期化

- [x] pyproject.toml 作成、venv セットアップ
- [x] discord.py インストール
- [x] プロジェクトのディレクトリ構成を決める
- [x] 動作確認: Python スクリプトがローカルで実行できる

## M2: Discord Bot アプリケーション登録

- [ ] Discord Developer Portal でアプリケーション作成
- [ ] Bot ユーザー作成、トークン取得
- [ ] Bot を開発用 Discord サーバーに招待
- [ ] トークンの管理方法を決める（.env 等）

## M3: Bot がオンラインになる
**実行環境: ローカル → Discord**

- [ ] Bot が Discord に接続してオンラインになる
- [ ] 簡単なスラッシュコマンド（例: /ping）に応答する
- [ ] 動作確認: Discord 上で Bot がオンライン表示され、コマンドに返答する

## M4: Bot が音声チャンネルに参加する
**実行環境: ローカル → Discord 音声チャンネル**

- [ ] コマンドで Bot が音声チャンネルに参加・退出できる
- [ ] discord.py の voice 関連 API を理解する
- [ ] 動作確認: Bot が音声チャンネルに入ってきて、コマンドで退出する

## M5: 録音機能
**実行環境: ローカル → Discord 音声チャンネル → ローカルファイル**

- [ ] 音声チャンネルの音声を受信・録音する
- [ ] 録音の開始・停止をコマンドで制御する
- [ ] 音声ファイル（mp3/wav）としてローカルに保存する
- [ ] 動作確認: 実際に喋った内容がファイルとして残っている

## M6: Docker 化
**実行環境: ローカル Docker コンテナ → Discord**

- [ ] Dockerfile 作成
- [ ] docker build & run でBot が起動する
- [ ] 動作確認: コンテナ内の Bot が Discord に接続し、録音できる（M5 までの機能がコンテナ上で動く）

## M7: S3 連携
**実行環境: ローカル Docker コンテナ → S3**

- [ ] AWS アカウント・IAM ユーザー/ロールのセットアップ
- [ ] S3 バケット作成
- [ ] Boto3 で録音ファイルを S3 にアップロードする
- [ ] Discord にダウンロードリンク（署名付き URL）を通知する
- [ ] 動作確認: 録音 → S3 保存 → Discord にリンク投稿、の一連の流れが動く

## M8: ECS Fargate デプロイ
**実行環境: AWS (ECS Fargate) → Discord**

- [ ] ECR にイメージを push する
- [ ] ECS クラスター・タスク定義・サービスを作成する
- [ ] VPC・セキュリティグループの設定
- [ ] 動作確認: AWS 上で Bot が稼働し、M7 までの全機能が動く

## M9: 運用改善
**実行環境: AWS**

- [ ] EventBridge or Lambda による Bot の起動・停止スケジューリング
- [ ] CloudWatch でログ・モニタリング
- [ ] CI/CD パイプライン構築

---

## Future

- Transcribe / Whisper による自動文字起こし
- Bedrock (Claude) による要約生成
- Polly による音声発話
- Notta API 連携
