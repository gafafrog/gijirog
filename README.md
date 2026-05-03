# gijirog

Discord の音声チャンネルでミーティングを録音し、議事録作成を支援する Bot。

> 🚧 開発中 — プロジェクトの背景・方針・進捗は [docs/](docs/) を参照。

## MVP

- Discord 音声チャンネルに参加して録音
- 音声ファイルを S3 に保存
- Discord テキストチャンネルにダウンロードリンクを通知
- 文字起こしは外部サービスで行う前提

## Architecture (MVP)

```
Discord 音声チャンネル
  |
  v
ECS Fargate (Bot)
  |
  v
S3 (音声ファイル保存)
  |
  v
Discord テキストチャンネルにリンク通知
```

## 技術スタック

- 言語: Python
- Bot フレームワーク: discord.py
- インフラ: AWS (ECS Fargate, S3, ECR, EventBridge/Lambda)
- コンテナ化: Docker

## ローカル開発

### 前提

- `/gijirog/dev/*` パラメータを読める SSO プロファイルを持つ AWS アカウント
- AWS CLI v2
- [uv](https://docs.astral.sh/uv/)

このアカウント用に作った SSO プロファイル名を `AWS_PROFILE` にセットしてください（プロファイル名は自由）:

```bash
export AWS_PROFILE=gijirog-admin   # 自分でつけたプロファイル名に置き換える
```

シェルの rc、プロジェクト直下の `.envrc` (direnv)、あるいはシェルごとに毎回 export、いずれでも構いません。

### 初期セットアップ（環境ごとに 1 回）

Bot は実行時に AWS SSM Parameter Store から Discord 認証情報を読み込みます。最初に値を登録してください:

```bash
# Discord Bot トークン（SecureString として暗号化保存）
read -rs DISCORD_TOKEN   # 貼り付けるが画面には出ない
aws ssm put-parameter \
  --name /gijirog/dev/DISCORD_TOKEN \
  --type SecureString \
  --value "$DISCORD_TOKEN"
unset DISCORD_TOKEN

# スラッシュコマンドを sync する Discord サーバー (Guild) の ID
# 取得方法: Discord 設定で Developer Mode を ON → サーバーアイコンを右クリック → 「サーバー ID をコピー」
aws ssm put-parameter \
  --name /gijirog/dev/DISCORD_GUILD_ID \
  --type String \
  --value <your-test-server-id>
```

### Bot を起動する

```bash
aws sso login   # SSO セッションが切れていれば
./scripts/run-dev.sh
```

`run-dev.sh` は SSM から secrets を取得し、自プロセスの環境変数に export してから Bot を `exec` します。ディスクには何も書きません。
