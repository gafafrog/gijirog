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

## 2026-05-02

**マイルストーン**: M4（SSM 値投入 + ローカル運用整備）

### やったこと
冒頭で `infra/node_modules/` をうっかり全 stage してしまったため、まず `.gitignore` に `node_modules/` を追加し、`git restore --staged .` でアンステージするところから始めた。本題に入る前に、前回 2026-04-25 の AWS アカウント作成・CDK 雛形整備が `origin/2026-04-25` ブランチにあって main にマージされていなかったことが判明。当初は session log に見当たらず迷ったが、`git branch -a` で気付いて続きを追えるようになった。今回は `2026-05-02` ブランチを `origin/main` 上に切り直して作業した。

M4 の本作業として、まず SSM Parameter Store の概念整理（String / StringList / SecureString の違い、KMS マネージドキー vs カスタマーマネージドキー、階層的命名による IAM 絞り込み）を一通り確認したうえで、`gijirog-admin` profile から `aws ssm put-parameter` で `/gijirog/dev/DISCORD_TOKEN` を SecureString、`/gijirog/dev/DISCORD_GUILD_ID` を String として投入。配信中だったので `set -a && source .env && set +a` で値を環境変数経由に逃がしてからコマンドラインに `--value "$DISCORD_TOKEN"` の形で渡し、画面・履歴に値が出ない運用にした。マネコンの Parameter Store 画面でも箱の存在と SecureString 表示（値は `Show decrypted value` を押さない限り `********`）まで目視確認。

最初は `scripts/bootstrap.sh` で「SSM → `.env` 生成」する設計にしようとしたが、ユーザーから「実運用ではトークンをファイルシステムに置きたくない、SSM から取って**メモリ上だけ**で動かしたい」という方針転換が入った。これを受けて `scripts/run-dev.sh` に作り直し、SSM から取得した値をシェル変数に直接代入 → `export DISCORD_TOKEN DISCORD_GUILD_ID` → `exec uv run gijirog` する exec ラッパーパターンに変更。`bootstrap.sh`、`.env.example`、`.env` を順次削除。アプリ側でも `src/gijirog/__init__.py` の `load_dotenv()` を消し、`os.environ.pop("DISCORD_TOKEN")` で読了後に環境変数を削除する形に。`python-dotenv` 依存も `pyproject.toml` から外して `uv sync` で `uv.lock` を更新。

`run-dev.sh` 初版で `--profile gijirog-admin` をデフォルト値として埋めていたところ、ユーザーから「profile 名は開発者ごとに違うはず、ハードコードに違和感」と指摘。AWS CLI が標準で見る `AWS_PROFILE` 環境変数の慣習に乗る形に修正し、スクリプトから `--profile` 引数を完全に取り除いた。プロファイル名の指定責任は README へ。

動作確認は `mv .env .env.bak` → `./scripts/run-dev.sh` で Bot をオンライン化 → Discord で `/ping` → `pong` 受信、で完了。`load_dotenv()` 削除後の再回帰テストもクリア。最後に `.env.bak` を削除。

セッション末で README の構成に違和感がある旨の相談を受け、「製品ドキュメント」と「学習プロジェクトとしてのナラティブ」が同じファイルに混ざっている点を分離する方針へ。学習要素はプロジェクト成熟と共に消えていける構造を目指す。`docs/README.md` を新設し、学習プロジェクト宣言・学びたいこと・Walking Skeleton 方針・Future Ideas を集約。ルート README は冒頭に `> 🚧 開発中 — [docs/](docs/) を参照` の 1 行誘導だけ残し、Local Development セクションも英語から日本語に揃えた。完成時に `docs/README.md` 削除と README 1 行削除だけで「製品の顔」になる構造。

### 学んだこと・議論したこと
**SSM Parameter Store のタイプ選択**を整理した。`String`（平文）/ `StringList`（カンマ区切り）/ `SecureString`（KMS 暗号化）の 3 種類。Discord トークンは SecureString 一択。`SecureString` の暗号化キーは AWS マネージドキー（無料、`alias/aws/ssm`、自動ローテーション）とカスタマーマネージドキー（$1/月 + 使用料、キーポリシーで細かい制御）の 2 択で、今回のような「IAM で十分絞れる小規模 secret」には AWS マネージドキーで過不足なし。CMK は監査要件や復号権限を IAM とは別軸で絞る要件で出てくる選択肢。

**SecureString を CDK で扱えるか**を深掘りした。結論として CloudFormation の `AWS::SSM::Parameter` リソースは SecureString の create を直接サポートしていない（CFn テンプレに値を書かせない設計）。回避策は (A) Custom Resource で `AwsCustomResource` 経由で `PutParameter` を呼ぶ (B) AWS Secrets Manager に乗り換える (C) IAM ロールだけ CDK 管理して箱は CLI で作る、の 3 択。ユーザーから「IaC の意義は『第三者がコマンド一発で同じ環境を作れること』では？」という鋭い指摘が入った。これに対しては、secrets は **「箱（リソース定義）」と「中身（実トークン値）」を 2 階層に分ける**のが業界標準で、中身は repo から原理的に再現不能（各人の Bot トークンが違う）、再現可能性のスコープは「インフラの形」までという整理で合意。今回は IAM ポリシーだけ CDK で表現し、Parameter 本体は README の `aws ssm put-parameter` 手順で投入する方向（実装は次回）。

**`PutParameter` の API 形状**は「parameter を作成する」と「値を設定する」が分離されていない、という SSM 側の設計を確認した。CDK で「箱だけ宣言、値は CLI で」という分離が API 形状的にできない理由はここ。

**`mktemp` の挙動**を実演しながら確認した。引数なしで呼ぶとユニーク名の空ファイルを作り、パスを stdout に返す。macOS では `/tmp` ではなく `$TMPDIR`（`/var/folders/.../T/`）に作られる、というユーザーごとプライベートな一時ディレクトリ仕様も触れた。`mktemp` + 中間出力 + `mv` + `trap rm EXIT` の組み合わせは「アトミックなファイル書き換え」の Unix 定番パターン。今回は最終的に `bootstrap.sh` 自体を捨てたので使う場面はなくなったが、設計の語彙として共有できた。

**`.env` を作らないローカル開発**の方針について、メリットを整理した。ファイルにトークンが残らないので `.env` 誤コミット事故・シェル履歴経由の漏洩・`git status` で見えるうっかり、をすべて防げる。本番（ECS Fargate）も「タスク定義の `secrets` で SSM ARN 参照、ECS agent が起動時に環境変数注入」と同じ構造なので、dev と prod で「アプリは環境変数を読むだけ」が一致する（12-Factor）。一方で、同一ユーザーで動くプロセスは `ps -E` や `gdb` で環境変数・メモリを見られるという原理的限界はある。これは「うっかり目にしない」までの強度で、`os.environ.pop()` で見える窓を起動直後の数百 ms に絞ることで実用上は十分、という評価。

**スクリプトの「個人設定排除」**は、AWS CLI の `AWS_PROFILE` 環境変数規約に乗ることで素直に実現できる。`--profile` を渡さなければ AWS CLI が `AWS_PROFILE` → `[default]` の順で解決する。スクリプトは profile の存在を知らない agnostic な状態を保てる。direnv による per-directory 自動 export も将来オプションとして案内。

**README の二重性**については、製品ドキュメントと学習プロジェクトのナラティブを物理的に別ファイルにし、後者は `docs/` 配下に集約することで、プロジェクト成熟時に学習要素を「削除するだけ」で取り除ける構造になることを確認した。ファイル名は `docs/background.md` のような説明的なものより、`docs/README.md` という命名がディレクトリ index 慣習に乗れて自然、という結論（GitHub の `/docs/` 自動レンダリングも享受できる）。

### 次回やること
**M4 の最後の項目として、開発者用の IAM ロール（または Permission Set）を作成する**。現状はローカル開発を SSO の `AdministratorAccess` で動かしているが、本来は `/gijirog/dev/*` の `ssm:GetParameter` + `kms:Decrypt`（AWS マネージドキー）だけに絞られた最小権限ロールに置き換えるべき。これを CDK で書くことで、`infra/lib/infra-stack.ts` に最初の意味のあるリソースが入り、CDK プロジェクトの動作確認（`cdk bootstrap` → `cdk deploy`）も兼ねられる。「何に対するアクセス権を持って動いているか」を意識しながら開発する状態を作ることが目的。実装後は SSO ログイン時のロール選択でこのロールに切り替えてみて、`run-dev.sh` が引き続き動くことを確認する。

## 2026-05-03

**マイルストーン**: M4（開発者用 Permission Set の最小権限化、完了）

### やったこと
M4 の最終項目「開発者用ロールの最小権限化」に着手。前回の milestones では CDK で IAM Role を書いて `cdk bootstrap` / `cdk deploy` の練習も兼ねる方針だったが、セッション冒頭でユーザーから「この開発者ロールは本当にアプリ層のインフラか？むしろ組織インフラとしてオンボーディング時に整えるべきものでは？」という鋭い問いが入り、設計方針から議論し直した。最終的に「CDK 管理ではなく IdC 上で手動作成、必要権限は README に policy JSON として明記」という方針に転換し、CDK 初 deploy の練習は M6 (ECS) に持ち越し。

実作業としては (1) `docs/milestones.md` の M4 最終項目を CDK ベースから IdC 手動 + README 明記方針に書き換え、(2) ルート README の「ローカル開発」を「管理者側で整っていること（declarative な前提）」と「開発者の初期設定（actionable な手順）」の二層構造に再構成、(3) 最小権限 policy JSON（`/gijirog/dev/*` の `ssm:GetParameter` + KMS マネージドキーの `kms:Decrypt` を `kms:ViaService` Condition で SSM 経由のみに絞る）を README の前提セクションに記載、(4) アカウント ID と region は `<ACCOUNT_ID>` / `<REGION>` プレースホルダ化、(5) ユーザー側で IdC に Permission Set を作成 → 自ユーザーに割当 → 新ロールで `./scripts/run-dev.sh` が動くことを疎通確認、まで完了。put-parameter の recipe は管理者の責務として README から消え、開発者向けセクションは declarative な前提に吸収された。

### 学んだこと・議論したこと
**開発者ロールはアプリ層か Identity 層か**を整理した。実務では Identity 層（IdC、Permission Set、SSO グループ）にあるのが定石で、理由は (a) chicken-and-egg 回避（その役割を deploy するための権限が要る）、(b) 複数アプリ持つ組織で各アプリリポに分散させるとスケールしない、(c) 人事イベント（入社・退職・異動）は Identity 層だけで吸収できる、の 3 点。中間案として「アプリ側の ManagedPolicy だけ CDK で、ロール割当は Identity 層」というハイブリッドもあるが、1人プロジェクトでは過剰。今回は「README に policy JSON で spec を残す」ことで、将来「組織インフラ CDK」として切り出したくなった時の仕様書として機能させる方向にした。経緯としては、当初 milestones 側で「CDK 初 deploy の練習も兼ねる」という副次効果を期待していたが、設計の正しさを優先して切り離した形。

**README で個人設定をプレースホルダにする理由**は OPSEC ではなく **「README 正確性」**だ、というユーザーからの framing が鋭かった。読者は当然別のアカウントで動かすので、自分の account ID を書くのは事実として誤り。同じ理屈で region もプレースホルダ化した。前回 (4/25) の「Account ID は機密ではないが OPSEC 的に伏せる」とは別軸で、こちらは「読者にとって正しいか」という観点。この framing に合わせて既存の feedback メモリ「スクリプトに個人設定をハードコードしない」を「ユーザー向け成果物（スクリプト・README 共通）に個人設定を埋め込まない」に拡張。

**ドキュメントでも「default to no comments」が適用される**ことを学んだ。最初 policy JSON の下に「KMS の Resource: \"*\" は AWS マネージドキーの key ID がアカウント/リージョンごとに動的だから広めに取り、代わりに kms:ViaService Condition で...」という解説文を入れたが、ユーザーから「こういうの書かなくて良くないか？自明でない？」と即指摘されて削除。policy 自体に Sid 名で意図が出ているので散文補足は冗長で、本当に非自明な情報がノイズに埋もれる。code に対する「コメントは WHY が非自明な時だけ」という原則は、そのまま README にも適用される。

**README の二層構造**を確立した。「管理者側で整っていること」は declarative（"こういう状態になってる必要がある" だけ書く）、「開発者の初期設定」は actionable（手元で実行する手順）。前者には CLI コマンドを書かない。これにより、put-parameter の recipe は admin の責務として消え、開発者は「SSM パラメータが投入済」という前提だけを受け取る形になった。「Prereq セクションは admin/developer の二軸に分けるとスッキリする」というのが今回の最大の構造的学び。1人プロジェクトでも admin と developer は別の「役割」として書き分けると、リポジトリの再現性スコープが明確になる。

**判断の経緯は session log、結果は README** という運用方針を明文化した。docs/README.md に判断ログを溜める ADR 的な運用は始めない。経緯は時系列で session log に流す、繰り返し参照される設計原則だけが docs/、結果は README、という線引き。今回の「アプリ層 vs Identity 層」議論も、結論だけ milestones の方針メモと README の policy spec として残し、議論経緯はこの session log に集約。

**KMS マネージドキーへのアクセス絞り込みパターン**として、`alias/aws/ssm` のようなマネージドキーは key ID がアカウント・リージョンごとに動的なので Resource を ARN で固定しにくい。`Resource: "*"` + `kms:ViaService` Condition で「SSM 経由の Decrypt のみ」に絞るのが定石、と確認。Condition 側にリージョン情報（`ssm.<REGION>.amazonaws.com`）が入るので、リージョン横断の Decrypt にはならず、実用上の最小権限は達成できる。

### 次回やること
**M5: Docker 化**。`Dockerfile` を書いて、`docker build` → `docker run` でローカル Bot が Discord に接続し `/ping` に応答するところまで。ローカル Mac から直接走らせる代わりにコンテナ内から走らせるだけで、AWS 側（SSM 取得 → 環境変数注入）のフローは run-dev.sh と同じ構造を維持できるはず。残務として `AdministratorAccess` の自分への割り当てを IdC で外す（Dev ロールで疎通確認済なので不要）。

## 2026-05-03

**マイルストーン**: M5（Docker 化）

### やったこと
Docker 初心者向けに、まず Docker / image / container の概念を整理した。Ansible は既存マシンのセットアップ、Vagrant は VM ベースの開発環境、Docker はアプリと実行環境を image として固めて container として起動するもの、と比較して理解した。`docker run hello-world` で Docker Desktop の導入確認を行い、Docker client / daemon / Docker Hub からの pull / container 実行 / terminal への出力までが通っていることを確認した。

gijirog 用の `Dockerfile` と `.dockerignore` を追加した。`Dockerfile` は `python:3.12-slim` を土台にし、uv の公式 image から `uv` バイナリだけをコピーし、`uv.lock` に基づいて依存を install する構成にした。`.dockerignore` には `.env` / `.env.*` / `.venv` / `node_modules` / `*~` などを入れ、build context に secrets や不要なローカル成果物が入らないようにした。

初回 build では `uv sync --locked --no-dev` の時点で `src/gijirog/__init__.py` がないというエラーになった。原因は、依存定義だけを先にコピーした状態で `uv sync` がプロジェクト自身も install しようとしたこと。これを受けて、先に `uv sync --locked --no-dev --no-install-project` で外部依存だけを入れ、`src/` をコピーした後にもう一度 `uv sync --locked --no-dev` して gijirog 本体を install する構成に修正した。

次の build では `README.md` がないというエラーになった。`pyproject.toml` の `readme = "README.md"` により、実行時ではなく Python package の build/install 時に README が metadata として必要になるため。`COPY pyproject.toml uv.lock README.md ./` に修正して build が通ることを確認した。

既存の `scripts/run-dev.sh` はそのまま残し、Docker 用に `scripts/run-dev-container.sh` を追加した。SSM から secrets を取得する責務は引き続きホスト側に置き、container には `docker run -e DISCORD_TOKEN -e DISCORD_GUILD_ID` で環境変数として渡す設計にした。`docker build -t gijirog:dev .` → `./scripts/run-dev-container.sh` → Discord で `/ping` が `pong` を返すこと、`docker ps` に起動中 container が表示されることを確認した。

README も更新し、開発者の初期設定に Docker Desktop を追加した。起動手順は「Bot をローカルで起動する」と「Bot を Docker で起動する」に分け、Docker 版は build 後に `run-dev-container.sh` を使う手順として記載した。

### 学んだこと・議論したこと
**image と container の違い**を整理した。image はアプリと実行環境を固めたテンプレート、container は image から起動した実行中または終了済みの実体。`hello-world` はメッセージを出してすぐ終了するため `docker ps` には出ず、終了済みも含める `docker ps -a` で見る対象になる。一方 Bot のような常駐プロセスは起動中 `docker ps` に出続ける。

**Docker における依存関係**も 2 種類に分けて理解した。Python package のようなアプリ内依存は uv が解決し、その結果を image に入れる。MariaDB や Redis のような別プロセス依存は、自分たちの image が MariaDB image を継承するのではなく、別 container として起動して network でつなぐ。複数 container の起動管理には Docker Compose が使われる。

**ECR の役割**を確認した。ECR はビルド済み container image の置き場であり、ECS/Fargate はソースコードを build する場所ではなく、ECR から image を pull して container として起動する場所。ローカル開発では各開発者が同じ Dockerfile から手元の image を build するが、本番・検証環境では CI が build/push した同一 image を registry から pull して使う、という役割分担を整理した。

**build と run の分離**について議論した。`run-dev-container.sh` に `docker build` まで含める案も自然だが、学習段階では「image を作る」と「container を起動する」を分けた方が Docker の責務が見えやすい。将来的に Makefile や task runner で `build + run` をまとめるのはありだが、今は `docker build -t gijirog:dev .` と `./scripts/run-dev-container.sh` を明示的に分ける方針にした。

**secrets の扱い**は M4 の方針を維持した。Docker image には `DISCORD_TOKEN` や `DISCORD_GUILD_ID` を含めず、ホスト側で SSM から取得して container 起動時に環境変数として注入する。これは将来 ECS/Fargate で task definition の secrets が SSM parameter を参照し、起動時に container 環境変数へ注入する構造にもつながる。

**Dockerfile の COPY 元**についても確認した。通常の `COPY` は `docker build` の build context 内から image にファイルを入れる。`COPY --from=...` は別 image や別 build stage からファイルをコピーする。今回の `COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv` は、uv の image から uv バイナリだけを借りる multi-stage build の一種として理解した。

### 次回やること
今回の差分を review して commit する。その後、M6「ECS Fargate に Walking Skeleton をデプロイ」に入る前に、ECR / ECS / task definition / secrets 注入の関係を改めて整理する。
