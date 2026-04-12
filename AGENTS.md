# AGENTS.md

## Project Context

gijirog は Discord 議事録 Bot の学習プロジェクト。AWS サービスの習得を兼ねている。開発者は趣味として焦らず学習機会を大事にしながら進めたい意向。

## Technical Decisions

- **Language: Python** — Discord Bot ライブラリ (discord.py)、AWS SDK (Boto3)、AI/ML エコシステムとの相性が良い
- **Compute: ECS Fargate** — Bot の常駐実行に適している。サーバー管理不要でコンテナ化の学習にもなる
- **Storage: S3** — 音声ファイルの保存先
- **MVP では文字起こしは外部サービス (Notta) を利用** — 音声ファイル生成までが Bot の責務。S3 を境界にして後段の処理を疎結合にしておく

## Architecture Principles

- S3 を境界として Bot（録音）と後段処理（文字起こし・要約）を分離する
- MTG 時のみ Bot を起動する設計にする（常時起動は月 ~$30、MTG 時のみなら ~$0.35）
- 将来 Transcribe や Whisper に切り替えられるよう、書き起こし部分はプラガブルに保つ

## Development Style

- AI driven development で進める
- 学習目的のため、効率よりも理解を優先する場面がある
- ドキュメントを充実させてから実装に入る方針
