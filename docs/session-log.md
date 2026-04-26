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

## 2026-04-19

**マイルストーン**: M3

### やったこと
M3「Bot がオンラインになる」を完了した。`src/gijirog/__init__.py` を書き換え、`discord.Client` を継承した `GijirogClient` クラスに `app_commands.CommandTree` を持たせ、`/ping` スラッシュコマンドを Guild scoped で sync する構成にした。`.env.example` に `DISCORD_GUILD_ID` を追加し、ユーザーはテストサーバーの ID を Discord クライアントの開発者モード経由で取得して `.env` に追記。Intents は `Intents.default()` で message_content を OFF（スラッシュコマンドだけなら本文不要）、YAGNI で最小構成に絞った。「公開一人勉強会」チャンネルで `/ping` を実行し `pong` が返ることを確認、M3 完了。

ハウスキーピングとして `.gitignore` に `*~`（Emacs バックアップ）を追加。エディタ固有は本来グローバル gitignore 向きだが、既に `.swp` や `.idea/` が入っていたので一貫性を優先してプロジェクト側に入れた。

本セッションは connpass「等身大エンジニア会（公開一人勉強会）」として配信しながら進めたため、トークンや Guild ID など機密性のある表示には前もって警告を挟む運用を徹底した。

### 学んだこと・議論したこと
Discord API の用語では「サーバー」は **Guild** と呼ばれる。UI 上の呼称（Server）と API 上の呼称（Guild）がズレているだけで指しているものは同じ。スラッシュコマンドは使用前に Discord API への登録（sync）が必要で、Guild scope（指定サーバーに即時反映）と Global scope（全招待サーバー、最大 1 時間遅延）の 2 種類がある。開発中は Guild scope 一択。

Intents は「Bot が受け取りたいイベントを事前申告する仕組み」。通常 Intents と Privileged Intents（message_content / members / presences）の 2 階層があり、Privileged 側は Developer Portal での明示 ON が必要。スラッシュコマンドは Discord 側で解釈されて Interaction イベントとして届くので **message_content は不要**。一方、プレフィックスコマンド（`!hello` のような）は本文解釈が必要なので message_content 必須。音声録音機能は Intents の話ではなくライブラリの話で、公式 discord.py が voice 受信を長らく非対応にしているため、M6 あたりで `discord-ext-voice-recv` or `py-cord` への乗り換えを検討することになる。

Guild ID の秘匿性については「暗号的秘密ではない（知られても入室は不可）が、配信で積極的に見せる必要もない」という中間的な扱いと整理。`.env` に入れる運用で十分。

Python の `async def` / `await` を初めてちゃんと扱った。普通の `def` と違い、`async def` は呼び出してもコードが走らず **コルーチン** オブジェクトを返すだけで、イベントループが `await` を介して実行を進める。`client.run()` が裏でイベントループを起動・維持しているため、我々は `async def` で関数を書き、`@client.tree.command` や `@client.event` で登録するだけで済む。`await` は `async def` の中でしか使えない。Bot のように I/O 待ちが大半の処理では、シングルスレッドで多数のイベントを並行捌きできるという async のメリットが効く。

`build_client` 関数の中に `async def ping(...)` を書いているのは、**デコレータの副作用でコマンドを特定の client.tree に登録する**ためのパターン。Python の `def` は宣言ではなく実行可能な文なので、関数の中でも `if` の中でも書ける。トップレベルにフラットに書くスタイルも機構上は成立するが、「import 時に client が作られる副作用」「シングルトン前提になる」等のトレードオフがある。Flask の `app = Flask(__name__)` パターンが典型例。

`python-dotenv` の `load_dotenv()` は `.env` の値をプロセスの環境変数にセットする（あたかも、ではなく実際に `os.environ` 経由で読める）。既存の環境変数は上書きしない仕様（シェル優先）で、これは本番環境で `.env` がうっかり残っていても事故らないようにという防御。Python 標準ではなくサードパーティで、Node.js の `dotenv` npm パッケージと同じポジション。12-Factor App の「コードは環境変数を読むだけ、値の供給源は環境ごとに差し替えられる」思想に沿っている。

ログの出力先は `logging.basicConfig()` のデフォルトで **stderr**。stdout ではない。ターミナルでは区別がつかないがリダイレクト時に違いが出る。ECS Fargate では stdout/stderr が自動で CloudWatch Logs に流れる運用になるので、ファイル出力ではなく stream に出す今の設計がそのまま本番に乗る。

Discord Bot の通信経路は **Gateway（WebSocket, 常時接続）** と **REST API（HTTPS, 都度接続）** のハイブリッド構成になっている。`client.run()` 以降は Gateway への WebSocket が張りっぱなしになり、Heartbeat（約 40 秒間隔）で維持される。ユーザーが `/ping` を叩いた通知は Gateway 経由で Interaction イベントとして届き、`await interaction.response.send_message("pong")` の返信だけが REST API で HTTPS POST として都度発行される。切断されても discord.py が自動再接続してくれる。この「常時接続で通知を受け、都度接続で操作する」ハイブリッドは Slack Bot、LINE Bot、MQTT、WebRTC シグナリング等にも共通する業界標準パターン。

### 次回やること
M4: AWS SSM Parameter Store による Secrets 管理への移行。AWS CLI セットアップ → IAM 権限設計 → `/gijirog/dev/DISCORD_TOKEN` を SecureString として登録 → `scripts/bootstrap.sh` で SSM から `.env` を生成する流れを構築する。

## 2026-04-23

**マイルストーン**: M4 準備

### やったこと
`docs/milestones.md` を更新し、Hello World の次にインフラ基盤を先に整える順番へマイルストーンを並べ替えた。具体的には、M4 を AWS SSM による Secrets 管理、M5 を Docker 化、M6 を ECS Fargate への Walking Skeleton デプロイ、M7 を CI/CD 整備とし、その後ろに音声チャンネル参加、録音、S3 連携を配置した。これにより「機能を増やしてから後でインフラに載せる」のではなく、「最小機能の時点でデプロイ可能な土台を作ってから機能追加する」流れに整理した。

あわせて、次回の IaC 着手に向けた基本方針を決めた。IaC ツールは AWS CDK を採用し、使用言語は TypeScript とする。リポジトリ構成は既存の `src/gijirog` をそのまま維持し、インフラコードを置く新しいディレクトリとして `infra/` を repo 直下に追加する方針にした。

また、CI/CD は最初から完全自動デプロイにせず、まずは手動承認つきの半自動 deploy から始める方針で合意した。PR の作成とマージはブラウザ上で行い、学習しながら安全に段階を踏む構成を目指す。

### 学んだこと・議論したこと
インフラを早めに作る理由を改めて整理した。録音や S3 連携のような機能を先に膨らませると、後から Docker / ECS / CI/CD に載せた際に、アプリの問題とインフラの問題が一度に噴き出して切り分けが難しくなる。そこで、`/ping` のような最小の Bot が動くうちに Docker 化、ECS デプロイ、CI/CD の流れを通しておくと、その後の機能追加は「既にデプロイ可能な土台の上での差分」として進められる、という判断に至った。

IaC の選定では、CDK を Python ではなく TypeScript で使う方が、公式ドキュメント・サンプル・記事の情報量が多く学びやすいと確認した。Bot 本体は Python のまま、インフラは TypeScript の CDK として責務分離する構成でよい、という整理になった。

ディレクトリ構成についても確認した。`src/gijirog` の `src` は「リポジトリ全体のソース置き場」という意味ではなく、「Python の import 対象パッケージを置く src layout」という文脈で理解するのが正しい。したがって、`src/gijirog` と `infra/` が並ぶのは概念的に完全対称ではないが、実務上よくある構成であり、このプロジェクトでも無理なく採用できる。

配信前提の開発であることも改めて共有した。トークンや AWS 認証情報、`.env` 実値などの秘密情報は引き続き画面・ログ・コマンド出力に出さない運用を徹底する。

### 次回やること
M4 の実作業に入る前提で、`infra/` 配下の最小構成と、最初に CDK 管理する AWS リソースの範囲を決める。あわせて、AWS SSM を使った Secrets 管理の実装に着手する。

## 2026-04-25

**マイルストーン**: M4 (AWS アカウント整備 + CDK プロジェクト初期化)

### やったこと
M4 の AWS 側の足回りを一気に整えた。AWS Organizations の管理アカウントから gijirog 専用 AWS アカウントを新規作成（root メールは Fastmail の plus-addressing で一意化）、IAM Identity Center で自分のユーザーに `AdministratorAccess` Permission Set を割当。`aws configure sso --profile gijirog` で CLI から SSO ログインし、既存の sso-session を再利用する形でローカル profile を追加（最初 `frog-admin` という名前で作って管理アカウント向けだったと判明し、別途 gijirog 用に作り直し → リネームでスキーム統一）。`aws sts get-caller-identity --profile gijirog` で gijirog アカウント側に疎通することを確認。

Node 環境を一新した。古い `/usr/local/bin/node` v17.3.0 (2021/12 の .pkg installer 由来、EOL) を関連ファイルごと撤去。代わりに **mise** (multi-language version manager) を Homebrew で導入し、`dotfiles/zsh/me.zsh` に `eval "$(mise activate zsh)"` を追加（`command -v mise` でガードして mise 未導入環境でも安全）。`infra/` を新設して `mise use node@22` で Node 22 LTS (22.22.2) を mise.toml に固定。

`infra/` 配下で `cdk init app --language typescript` を実行し、AWS CDK (TypeScript) プロジェクトの雛形を生成。CDK CLI (2.1119.0) と aws-cdk-lib (2.248) が devDependencies/dependencies に入った状態。`infra/.npmignore` と `infra/README.md` は CDK init のテンプレ生成物だが、今回は npm publish しない / プロジェクト固有情報がないので README は削除（.npmignore は害がないので残置）。

### 学んだこと・議論したこと
**AWS Account ID の機密性**を整理した。「認証情報ではないので漏れただけで侵入されることはない」が、フィッシングの足場にされる、雑な IAM 設計だと AssumeRole 試行に使われる、というリスクはある。家の番地に近い扱いで「機密ではないが、わざわざ見せる必要もない情報」。OPSEC（運用上の慎重さ）として配信中は伏せる方が無難で、仮に映っても認証情報ほど致命傷ではない、という温度感で確認した。

**IAM Identity Center の二層構造**を理解した。`~/.aws/config` の `[sso-session ...]` ブロックが「IdC への入口」（URL + Region + Scope）、`[profile ...]` が「(アカウント, Role) ごとのスイッチ」。SSO ログインは session 単位で 1 回やれば session 内全 profile に効くが、profile は入りたい (アカウント, Role) の数だけ必要。`sso_registration_scopes` は OAuth 2.0 の scope 概念で、AWS CLI 用は `sso:account:access` 一択（一時クレデンシャル取得に必要十分）。

JS エコシステムの「言語バージョン管理」と「パッケージマネージャ」の二軸が乱立している現状を整理した。Python では uv が両方を統合しているが、JS は nvm/fnm/mise/volta（バージョン管理）と npm/yarn/pnpm/bun（パッケージ管理）に分かれている。bun が統合候補として登場しているが過渡期。今回はバージョン管理として **mise**（asdf 後継、Rust 製、多言語対応）を採用。プロジェクトごとに `.tool-versions` / `mise.toml` で宣言できる思想が uv と揃う。読み方は「ミーズ」（フランス料理の `mise en place` 由来）。

**`.npmignore`** は `npm publish` 時の除外リストで、`.gitignore` が「git で追跡しないか」、`.npmignore` が「npm registry に載せないか」と守備範囲が違う。CDK アプリは publish しないので `.npmignore` は完全に死にファイル。Python の `MANIFEST.in` や Rust の `Cargo.toml` の `package.exclude` に対応する概念。

**`cdk init` の生成物の読み方**を確認した。十数ファイル出るが、実装で頻繁に触るのは `bin/infra.ts`（CDK App エントリ、Stack を `new`）と `lib/infra-stack.ts`（Stack 本体、ここに SSM など書く）の 2 つ。残り（`tsconfig.json`, `cdk.json`, `package.json`, `jest.config.js` など）は困った時に開く程度の位置付け。CDK アプリは大量のボイラープレートが標準で来るが、頑張って全部理解する必要はない。

**mise の activate と非対話シェルの相性**で軽くハマった。`mise activate zsh` は対話 shell 前提のフックを使うため、scripted な Bash 環境では PATH に `~/.local/share/mise/shims/` を入れるか、`~/.local/share/mise/installs/node/<ver>/bin/` を直接指す必要があった。普段使いには `me.zsh` の activate 行で問題なし。

**CDK 設計方針**としては、SSM Parameter Store で「リソース定義は IaC（CDK）、値は別経路（`aws ssm put-parameter`）で投入」する分離を維持する方向。実トークンを CDK コードや GitHub に入れない、という原則に沿わせる。

### 次回やること
M4 の続き。SSM Parameter Store の機能整理（String / StringList / SecureString の差、KMS デフォルトキー vs カスタムキー、階層的命名規約と IAM での絞り方）→ 必要なリソースの洗い出し → `lib/infra-stack.ts` に SSM Parameter リソースを書き、`bin/infra.ts` で env を gijirog アカウントに明示する。余裕があれば `cdk bootstrap` → `cdk deploy` → `aws ssm put-parameter` → `scripts/bootstrap.sh` 作成 → `.env` 削除して Bot 再オンライン、までのフルパスを通す。
