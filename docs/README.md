# gijirog 開発ドキュメント

このディレクトリは、gijirog プロジェクトの「来歴」と「進め方」を記録する場所です。プロジェクトの利用方法はリポジトリ直下の [README.md](../README.md) を参照してください。

## このプロジェクトについて

gijirog は学習プロジェクトです。Discord の議事録 Bot を end-to-end で作りながら、AWS の各種サービスや関連技術を実地で学ぶことを目的にしています。

### 学びたいこと

- AWS Organizations / IAM Identity Center
- ECS Fargate による常駐コンテナ運用
- SSM Parameter Store による Secrets 管理
- AWS CDK (TypeScript) での IaC
- GitHub Actions による CI/CD
- Discord Bot の内部（Gateway WebSocket / REST API / Voice）
- Python パッケージ管理（uv）と Node エコシステム（mise）

### 開発方針

- **Walking Skeleton**: 機能を増やす前に、最小機能の段階でデプロイ可能な土台を先に作る。「ローカルでは動くが本番で壊れる」を避けるため、Docker / ECS / CI/CD を早期に通す。
- **1 セッション 1 マイルストーン** (90 分目安)。詳細は [milestones.md](milestones.md)。
- **配信前提の開発**（等身大エンジニア会 公開一人勉強会）。トークン・認証情報・Account IDなどの機密情報は、画面・コマンド出力・コミットに出さない運用を徹底する。

## ディレクトリ内のドキュメント

- [milestones.md](milestones.md) — マイルストーン（ロードマップ）
- [session-log.md](session-log.md) — セッションごとの作業記録と学び

## Future Ideas

将来的に取り組みたいテーマ。マイルストーン化されていないバックログ。

- Amazon Transcribe / Whisper による自動文字起こし
- Bedrock (Claude) による議事録要約
- Amazon Polly による音声発話（ファシリテーション機能）
- Notta API 連携による自動書き起こし
- 過去の議事録検索
- リアルタイム文字起こし表示
