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

**マイルストーン**: M1, M2

### やったこと
Python パッケージマネージャとして uv を採用し、プロジェクトを初期化した。Homebrew で uv をインストールし、`uv init --package --name gijirog` で src/gijirog/ 配下のパッケージ構成を作成。Docker 化やデプロイ時に扱いやすいパッケージ構成（flat layout ではなく src/ layout）を選んだ。Python バージョンは 3.9 から 3.12 に引き上げ、`uv add` で discord.py (2.7.1) と python-dotenv (1.2.2) を追加。`.gitignore` を作成し、`uv run gijirog` と `import discord` で動作確認して M1 を完了した。

続けて M2（Discord Bot アプリケーション登録）に進んだ。Discord Developer Portal で `gijirog` アプリを作成し、Bot タブで Public Bot を OFF に設定。途中 "Private application cannot have a default authorization link" エラーが出たが、Installation タブの Install Link を None にすることで解消。Privileged Gateway Intents のうち Message Content Intent のみ ON（Presence / Server Members は OFF）にして保存。トークンを Reset Token で発行し、画面共有を切った状態で取得、`pbpaste > ~/Desktop/discord-token.txt` で一旦ファイル化した後、`echo "DISCORD_TOKEN=$(cat ...)" > .env && rm ...` で `.env` に移行。`.env.example` も作成しコミット対象に含めた。OAuth2 URL Generator で招待 URL を生成（scopes: bot, applications.commands / permissions: Send Messages, Read Message History, View Channels, Connect, Speak）、テストサーバーに招待して Bot がオフライン状態でメンバー一覧に現れることを確認し M2 完了。

また、機能完成前に早期デプロイ + CI/CD を構築する方針（Walking Skeleton）を決めた。将来 M3 完了後にデプロイを前倒しする形で milestones を組み替える予定。本セッションではさらに、新マイルストーン M4「AWS SSM による Secrets 管理へ移行」を挿入し、旧 M4〜M9 を M5〜M10 に繰り下げた。M3 で動く Bot のトークン供給を .env 直書きから SSM 取得に置き換える段取り。

### 学んだこと・議論したこと
Python のパッケージマネージャ事情を整理した。pip は標準同梱のインストーラに過ぎず、Poetry / Pipenv / Rye / PDM / Hatch / uv など多数のツールが乱立している。一方でレジストリ（PyPI）は統一されており、「レジストリ層は統一され、ツール層は競合する」という他言語（JS の npm/yarn/pnpm/bun、Java の Maven/Gradle）にも共通する構造だと確認した。uv は Astral 社（Ruff の開発元）が Rust で実装した統合型ツールで、pip + venv + pyenv + pipx + Poetry 相当を 1 本で置き換える。新規プロジェクトのデファクトに寄りつつある段階と判断し採用した。

uv の仕組みで面白かった点として、`uv` が `.venv/.gitignore` を自動で置き（中身は `*`）、トップレベルの `.gitignore` が無くても venv が git から除外されるテクニックがある。`uv.lock` はアプリではコミット、ライブラリではコミットしないのが定石。

`git check-ignore -v` というコマンドも学んだ。特定のパスがどの .gitignore のどの行で ignore されているかを表示するデバッグ用コマンド。

`uv.lock` の中身を実際に読んでみて、lockfile が何を保証しているかを理解した。pyproject.toml は「discord.py を使いたい」程度の緩い宣言だが、uv.lock は **14 パッケージ全て**（直接依存 2 + 推移的依存 12）を**ドンピシャのバージョン + SHA256 ハッシュ + プラットフォーム別 wheel URL** で固定している。これにより CI や本番で「ローカルでは動いたのに壊れた」が起きにくくなる。推移的依存まで固定しないと、間接的な依存が破壊的更新された時に自分のコードを一切変えていないのに壊れる、という典型的事故を防げる。`uv tree` で依存ツリーを人間向けに表示できる。

uv が「パッケージマネージャ」の枠を超えた統合ツールであることを理解した。`uv run` は venv アクティベーションを意識せずに、pyproject.toml / uv.lock / Python バージョンを全部合わせた状態でコマンドを実行してくれる。cargo (Rust) や npm (Node) に近い体験。`uv python install` で Python 本体もインストールできるので、pyenv 相当の機能も含んでいる。

他言語と比較すると、開発者ツールが「一つで全部」に収斂していく潮流が明確にある。Rust (cargo) や Go は最初から統合されたお手本。.NET も dotnet CLI で統合された。Deno は「電池内蔵」を旗印に設計された。Node は npm / yarn / pnpm / bun が競合していて、特に bun がランタイム + パッケージマネージャ + テスト + バンドラを一本化する野心的な路線。Python は uv、JS は bun が旗手となって、古い言語も徐々に統合ツールに寄せている段階。Ruby / Java あたりは統合の動きが弱め。この潮流が生まれた理由は、新規参入のハードルを下げることと、ツール間連携でキャッシュや並列化が効いて高速化できること、そして cargo が「一つで全部」が快適かつスケールすると実証したこと。

M2 を通して `.env` / `.env.example` の運用パターンを整理した。`.env` はコミットせず（.gitignore で除外）、`.env.example` はコミットして「この Bot を動かすには何のキーが必要か」という設計書の役割を持たせる。`.gitignore` で `.env*` をまとめて除外しつつ `!.env.example` で例外指定することで、安全に両立できる。また、`python-dotenv` の `load_dotenv()` は `.env` が無くてもエラーにならないため、ローカル（.env あり）と本番（環境変数が直接注入される）で同じコードが動く、という 12-Factor App の思想に沿った設計になることを確認した。

セッション後半は Secrets 管理の最終形について深掘りした。本番は AWS で動かすため、AWS での選択肢として SSM Parameter Store と Secrets Manager を比較。今回のような Discord トークンは自動ローテーションが不要で、無料枠のある SSM Parameter Store が妥当と判断。運用の肝は「環境ごとに prefix を切る (/gijirog/dev/, /gijirog/prod/)」「IAM ポリシーで開発者は dev のみ、ECS タスクロールは prod のみ読める」「本番トークンは開発者が触れない」という設計。認証側では SSO (IAM Identity Center) が長期アクセスキーを Mac に置かずに済むため推奨。代替として aws-vault + Keychain、または単純な IAM ユーザー + アクセスキーがある。

ローカル開発者のワークフローとしては、`scripts/bootstrap.sh` を走らせると AWS SSM からトークンを取ってきて `.env` を生成する形を採用する想定。本番 (ECS Fargate) ではタスク定義の `secrets` フィールドで SSM ARN を参照すると ECS agent が自動で環境変数に注入してくれる。共通項は「アプリが見るのは環境変数だけで、SSM を直接叩かない」ことで、これによりコードのポータビリティ（ローカル / ECS / k8s / bare metal どこでも動く）、テスト容易性、起動速度、オフライン耐性などのメリットが得られる。上級者向けには direnv + aws-vault で `cd` した瞬間に環境変数がセットされる運用もある。

議論の結果、当初「M2.5」として差し込もうとしていた SSM 導入を、`.env` のトークンが実際に使われる M3（Bot オンライン）の後に配置することにした。トークンが使われていない段階で管理方法を改善しても体感が薄いため、Hello World Bot でトークンが活きている状態から SSM に移行するほうが学習効果と満足感が高い、という判断。マイルストーン名も小数点を避けて素直に M4 に繰り上げ、以降を M5〜M10 に後ろ倒した。

### 次回やること
M3: Bot がオンラインになる（.env から DISCORD_TOKEN を読み、discord.py で接続、簡単なスラッシュコマンド /ping 応答、Discord 上でオンライン表示確認）。M3 が終わったら M4 で SSM 移行に進む。
