# Session Log

## 2026-04-12

**マイルストーン**: M0

### やったこと
gijirog プロジェクトを立ち上げた。GitHub に gafafrog/gijirog としてリポジトリを作成し、README.md、AGENTS.md、docs/milestones.md の3つのドキュメントを整備した。また、セッション記録用のスキル（/session-log）と docs/session-log.md を用意した。

### 学んだこと・議論したこと
Discord 議事録 Bot のアーキテクチャを議論した。AWS の Compute 系サービス（EC2, ECS Fargate, Lambda, App Runner）を比較し、Bot の常駐実行には ECS Fargate が適していると判断した。ECS はコンテナのオーケストレーター、Fargate はその実行基盤であり、対等な比較対象ではなく組み合わせて使うものだと整理した。

MVP は「録音 → S3 保存 → Discord にリンク通知」とし、文字起こしは既存の Notta を手動で使う方針にした。S3 を境界にすることで、将来 Transcribe や Whisper に切り替える余地を残している。費用は MTG 時のみ起動（週2時間）で月額 $1 未満の見込み。

言語は Python を選択した。discord.py、Boto3、AI/ML エコシステムとの相性が決め手。

ターミナル環境の話題にも脱線し、iTerm で CLI Emacs の色がおかしかった原因が GNU Screen の true color 対応の限界だったことが判明した。Screen → tmux の移行で解決する。

### 次回やること
M1: Python プロジェクト初期化（pyproject.toml、venv、discord.py インストール）。
