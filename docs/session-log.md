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

## 2026-04-17

**マイルストーン**: M1

### やったこと
Python パッケージマネージャとして uv を採用し、プロジェクトを初期化した。Homebrew で uv をインストールし、`uv init --package --name gijirog` で src/gijirog/ 配下のパッケージ構成を作成。Docker 化やデプロイ時に扱いやすいパッケージ構成（flat layout ではなく src/ layout）を選んだ。Python バージョンは 3.9 から 3.12 に引き上げ、`uv add` で discord.py (2.7.1) と python-dotenv (1.2.2) を追加。`.gitignore` を作成し、`uv run gijirog` と `import discord` で動作確認して M1 の 4 項目を完了した。

また、機能完成前に早期デプロイ + CI/CD を構築する方針（Walking Skeleton）を決めた。将来 M3 完了後にデプロイを前倒しする形で milestones を組み替える予定。

### 学んだこと・議論したこと
Python のパッケージマネージャ事情を整理した。pip は標準同梱のインストーラに過ぎず、Poetry / Pipenv / Rye / PDM / Hatch / uv など多数のツールが乱立している。一方でレジストリ（PyPI）は統一されており、「レジストリ層は統一され、ツール層は競合する」という他言語（JS の npm/yarn/pnpm/bun、Java の Maven/Gradle）にも共通する構造だと確認した。uv は Astral 社（Ruff の開発元）が Rust で実装した統合型ツールで、pip + venv + pyenv + pipx + Poetry 相当を 1 本で置き換える。新規プロジェクトのデファクトに寄りつつある段階と判断し採用した。

uv の仕組みで面白かった点として、`uv` が `.venv/.gitignore` を自動で置き（中身は `*`）、トップレベルの `.gitignore` が無くても venv が git から除外されるテクニックがある。`uv.lock` はアプリではコミット、ライブラリではコミットしないのが定石。

`git check-ignore -v` というコマンドも学んだ。特定のパスがどの .gitignore のどの行で ignore されているかを表示するデバッグ用コマンド。

`uv.lock` の中身を実際に読んでみて、lockfile が何を保証しているかを理解した。pyproject.toml は「discord.py を使いたい」程度の緩い宣言だが、uv.lock は **14 パッケージ全て**（直接依存 2 + 推移的依存 12）を**ドンピシャのバージョン + SHA256 ハッシュ + プラットフォーム別 wheel URL** で固定している。これにより CI や本番で「ローカルでは動いたのに壊れた」が起きにくくなる。推移的依存まで固定しないと、間接的な依存が破壊的更新された時に自分のコードを一切変えていないのに壊れる、という典型的事故を防げる。`uv tree` で依存ツリーを人間向けに表示できる。

uv が「パッケージマネージャ」の枠を超えた統合ツールであることを理解した。`uv run` は venv アクティベーションを意識せずに、pyproject.toml / uv.lock / Python バージョンを全部合わせた状態でコマンドを実行してくれる。cargo (Rust) や npm (Node) に近い体験。`uv python install` で Python 本体もインストールできるので、pyenv 相当の機能も含んでいる。

他言語と比較すると、開発者ツールが「一つで全部」に収斂していく潮流が明確にある。Rust (cargo) や Go は最初から統合されたお手本。.NET も dotnet CLI で統合された。Deno は「電池内蔵」を旗印に設計された。Node は npm / yarn / pnpm / bun が競合していて、特に bun がランタイム + パッケージマネージャ + テスト + バンドラを一本化する野心的な路線。Python は uv、JS は bun が旗手となって、古い言語も徐々に統合ツールに寄せている段階。Ruby / Java あたりは統合の動きが弱め。この潮流が生まれた理由は、新規参入のハードルを下げることと、ツール間連携でキャッシュや並列化が効いて高速化できること、そして cargo が「一つで全部」が快適かつスケールすると実証したこと。

### 次回やること
M2: Discord Bot アプリケーション登録（Developer Portal でアプリ作成、Bot ユーザー作成、トークン取得、開発用サーバーに招待、.env でのトークン管理方針決定）。本セッション内で続行予定。
