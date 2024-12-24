# MCP Screenshot

スクリーンショットを撮影し、OCRで文字認識を行うMCPサーバーです。

## 機能

- スクリーンショットの撮影（左半分、右半分、全画面）
- OCRによるテキスト認識（日本語・英語対応）
- 複数の出力フォーマット対応（JSON, Markdown, 縦書き, 横書き）

## OCRエンジン

このサーバーは以下の2つのOCRエンジンを使用します：

1. [yomitoku](https://github.com/kazuph/yomitoku)
   - メインのOCRエンジン
   - 高精度な日本語認識が可能
   - APIサーバーとして動作

2. [Tesseract.js](https://github.com/naptha/tesseract.js)
   - フォールバック用OCRエンジン
   - yomitokuが利用できない場合に使用
   - 日本語と英語の認識に対応

## インストール

```bash
npx -y @kazuph/mcp-screenshot
```

## Claude Desktopでの設定

`claude_desktop_config.json` に以下のように設定を追加します：

```json
{
  "mcpServers": {
    "screenshot": {
      "command": "npx",
      "args": ["-y", "@kazuph/mcp-screenshot"],
      "env": {
        "OCR_API_URL": "http://localhost:8000"  // yomitoku APIのベースURL
      }
    }
  }
}
```

## 環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|--------------|
| OCR_API_URL | yomitoku APIのベースURL | http://localhost:8000 |

## 使用例

Claudeに以下のように指示することで利用できます：

```
画面の左半分をスクリーンショットして、その中のテキストを認識してください。
```

## ツールの仕様

### capture

スクリーンショットを撮影し、OCRを実行します。

オプション：
- `region`: スクリーンショット領域 ('left'/'right'/'full', デフォルト: 'left')
- `format`: 出力フォーマット ('json'/'markdown'/'vertical'/'horizontal', デフォルト: 'markdown')

## ライセンス

MIT

## 作者

kazuph
