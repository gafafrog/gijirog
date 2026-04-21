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

## Streaming / Secrets Safety

- この学習開発プロセスは配信される前提で進める。秘密情報は「見えない・出さない・残さない」を基本方針とする
- トークン、API キー、AWS 認証情報、`.env` の実値を画面・ログ・コマンド出力に表示しない
- `cat .env`、`print(os.environ)`、`env` など秘密情報を広く露出しうる確認方法は避ける
- Secrets を扱うコマンドは、値そのものではなく「取得に成功したか」「想定のキー名か」を確認する形で使う
- 配信・録画・スクリーンショット・ターミナル履歴に秘密情報が残る前提で行動し、実値の表示をデバッグ手段にしない
- 秘密情報はリポジトリにコミットしない。サンプルは `.env.example` に置き、実運用の値は SSM など外部の secret store で管理する
- README や docs には実値を書かず、環境変数名・パラメータ名・ダミー値だけを記載する
