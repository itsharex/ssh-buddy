# SSH Buddy UI/UX Design System

## Design Philosophy

SSH Buddy 採用 **「Terminal Craft」終端機工藝** 設計語言，以綠磷光（Phosphor Green）為主色調，擁抱終端機美學。

### 核心設計理念
- **終端機美學**：SSH 是命令列工具的核心，UI 應反映工具本質
- **綠磷光主題**：經典 Matrix 風格，辨識度極高，一眼就能認出
- **現代簡潔**：取終端機精髓（字體、發光、切角），不加復古濾鏡
- **專業工具感**：為開發者和系統管理員打造的專業界面

### 品牌識別元素
- **JetBrains Mono 等寬字體** - 全應用統一使用
- **綠色發光效果** - 終端機磷光光暈
- **索引編號** - 列表項目帶 00, 01, 02... 編號
- **終端機風格文案** - `// COMMENT_STYLE`、`[BUTTON_LABEL]`

---

## Color Palette - Phosphor Green Theme

### 背景色系（極深背景）
| 用途 | CSS 變數 | HSL 值 | 說明 |
|------|----------|--------|------|
| 主背景 | `--background` | `220 25% 4%` | 極深黑色 |
| 卡片背景 | `--card` | `220 22% 7%` | 側邊欄、卡片 |
| 懸浮背景 | `--popover` | `220 22% 9%` | 彈窗、下拉選單 |
| 強調背景 | `--accent` | `160 100% 40%` | 青綠高亮區域 |
| 次要背景 | `--muted` | `220 20% 12%` | 輸入框、disabled 區域 |

### 文字色系（帶綠色調）
| 用途 | CSS 變數 | HSL 值 | 說明 |
|------|----------|--------|------|
| 主要文字 | `--foreground` | `120 20% 90%` | 帶綠色調的淺色 |
| 次要文字 | `--muted-foreground` | `120 10% 50%` | 柔和綠色說明文字 |
| 卡片文字 | `--card-foreground` | `120 15% 88%` | 卡片內文字 |

### 品牌色系（綠磷光）
| 用途 | CSS 變數 | HSL 值 | 說明 |
|------|----------|--------|------|
| 主要色 | `--primary` | `120 100% 45%` | 綠磷光主色 |
| 主要色淡 | `--primary-muted` | `120 60% 30%` | 柔和綠色 |
| 強調色 | `--accent` | `160 100% 40%` | 青綠高亮 |

### 功能色系
| 用途 | CSS 變數 | HSL 值 | 說明 |
|------|----------|--------|------|
| 成功 | `--success` | `120 100% 45%` | 與主色相同 |
| 警告 | `--warning` | `45 100% 50%` | 琥珀色警告 |
| 錯誤 | `--destructive` | `0 72% 50%` | 紅色錯誤 |

### 終端機效果
| 用途 | CSS 變數 | 說明 |
|------|----------|------|
| 發光色 | `--terminal-glow` | `120 100% 45%` |
| 發光強度 | `--glow-intensity` | `0.25` |
| 發光範圍 | `--glow-spread` | `20px` |

### 邊框（帶綠色調）
| 用途 | CSS 變數 | HSL 值 | 說明 |
|------|----------|--------|------|
| 邊框 | `--border` | `120 30% 15%` | 帶綠色的邊框 |
| 輸入邊框 | `--input` | `220 20% 16%` | 輸入框邊框 |
| 焦點環 | `--ring` | `120 100% 45%` | 綠色 focus 狀態 |

---

## Typography

### 字體系統 - JetBrains Mono 為主
```css
/* 全應用統一使用等寬字體 */
font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
font-feature-settings: 'rlig' 1, 'calt' 1, 'liga' 1;
letter-spacing: -0.01em;
```

### 字體大小
| 用途 | 類別 | 大小 | 行高 | 字重 |
|------|------|------|------|------|
| 頁面標題 | `text-2xl` | 24px | 32px | 700 |
| 區塊標題 | `text-lg` | 18px | 28px | 600 |
| 內容標題 | `text-base` | 16px | 24px | 600 |
| 正文 | `text-sm` | 14px | 20px | 400 |
| 輔助文字 | `text-xs` | 12px | 16px | 400 |
| 程式碼 | `font-mono text-sm` | 14px | 20px | 400 |

### 使用指南
- 標題使用 `font-semibold` 或 `font-bold`
- 正文使用 `font-normal`
- SSH 指令、檔案路徑、金鑰內容使用等寬字體 `font-mono`
- 行高建議 1.5 倍字體大小

---

## Spacing

### 間距比例
基於 4px 的倍數系統：

| Token | 值 | 用途 |
|-------|-----|------|
| `space-0` | 0px | 無間距 |
| `space-1` | 4px | 圖示與文字間距 |
| `space-2` | 8px | 緊湊元素間距 |
| `space-3` | 12px | 表單欄位間距 |
| `space-4` | 16px | 卡片內間距 |
| `space-5` | 20px | 區塊間距 |
| `space-6` | 24px | 主要區塊分隔 |
| `space-8` | 32px | 頁面區塊分隔 |

### 常用間距規範
- **卡片內間距**: `p-4` (16px)
- **區塊間距**: `space-y-6` (24px)
- **表單欄位間距**: `space-y-4` (16px)
- **按鈕與文字間距**: `gap-2` (8px)
- **列表項目間距**: `space-y-1` (4px)

---

## Border Radius

| Token | 值 | 用途 |
|-------|-----|------|
| `rounded-sm` | 4px | 小型元素、標籤 |
| `rounded-md` | 6px | 按鈕、輸入框 |
| `rounded-lg` | 8px | 卡片、對話框 |
| `rounded-xl` | 12px | 大型容器 |
| `rounded-full` | 9999px | 圓形元素、徽章 |

---

## Component Guidelines

### Button

#### 變體
1. **Primary** (`variant="default"`)
   - 用途：主要操作（儲存、新增、確認）
   - 樣式：實心藍色背景，白色文字
   - hover：背景加深 10%

2. **Secondary** (`variant="secondary"`)
   - 用途：次要操作
   - 樣式：深灰背景，白色文字
   - hover：背景加亮

3. **Outline** (`variant="outline"`)
   - 用途：可選操作（取消、返回）
   - 樣式：透明背景，邊框
   - hover：輕微背景填充

4. **Ghost** (`variant="ghost"`)
   - 用途：輔助操作（圖示按鈕）
   - 樣式：無背景無邊框
   - hover：輕微背景填充

5. **Destructive** (`variant="destructive"`)
   - 用途：危險操作（刪除）
   - 樣式：紅色背景
   - hover：背景加深

#### 尺寸
- `size="default"`: h-10 px-4 - 標準按鈕
- `size="sm"`: h-9 px-3 - 緊湊場景
- `size="lg"`: h-11 px-8 - 強調操作
- `size="icon"`: h-10 w-10 - 圖示按鈕

### Input

#### 狀態樣式
```css
/* 預設 */
border: 1px solid var(--input);
background: var(--background);

/* Focus */
border-color: var(--primary);
ring: 2px var(--ring) with 20% opacity;

/* Error */
border-color: var(--destructive);

/* Disabled */
opacity: 0.5;
cursor: not-allowed;
```

#### 使用規範
- 始終搭配 Label 使用
- 提供清晰的 placeholder 提示
- 錯誤訊息顯示在輸入框下方
- 輔助說明使用 `text-xs text-muted-foreground`

### Card

#### 結構
```jsx
<Card>
  <CardHeader>
    <CardTitle>標題</CardTitle>
    <CardDescription>描述</CardDescription>
  </CardHeader>
  <CardContent>
    {/* 內容 */}
  </CardContent>
  <CardFooter>
    {/* 操作按鈕 */}
  </CardFooter>
</Card>
```

#### 樣式規範
- 背景：`bg-card`
- 邊框：`border border-border`
- 圓角：`rounded-lg`
- 內間距：`p-4` 或 `p-6`

### List Item

#### 狀態
```css
/* 預設 */
background: transparent;

/* Hover */
background: var(--accent) with 50% opacity;

/* Selected/Active */
background: var(--accent);
border-left: 2px solid var(--primary);
```

#### 結構
- 圖示 + 主要文字 + 次要資訊
- 主要文字使用 `truncate` 防止溢出
- 次要資訊（如 key type）靠右對齊

### Dialog

#### 結構
- Overlay：半透明黑色背景 `bg-black/80`
- Content：居中，最大寬度 `max-w-md`
- 動畫：fade-in + zoom-in

#### 使用規範
- 標題清晰描述目的
- 危險操作需二次確認
- 關閉方式：X 按鈕、點擊外部、ESC 鍵

### Empty State

#### 設計要素
1. 大型圖示（48px, 30% opacity）
2. 主要訊息（告知狀態）
3. 次要訊息（建議操作）
4. 行動按鈕（可選）

```jsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Icon className="h-12 w-12 text-muted-foreground/30 mb-4" />
  <p className="text-muted-foreground mb-1">沒有找到資料</p>
  <p className="text-sm text-muted-foreground/70">點擊 + 按鈕新增</p>
</div>
```

---

## Form Validation

### 驗證時機
1. **即時驗證**：使用者離開欄位時（onBlur）
2. **提交驗證**：表單提交時檢查所有欄位
3. **格式檢查**：輸入時即時提示格式要求

### 錯誤顯示
- 欄位邊框變為紅色
- 錯誤訊息顯示在欄位下方
- 使用 `text-destructive text-xs mt-1`

### 驗證規則

#### Host 表單
| 欄位 | 必填 | 驗證規則 |
|------|------|----------|
| Host Alias | 是 | 非空、無空格、唯一性 |
| HostName | 否 | IP 或域名格式 |
| User | 否 | 無空格 |
| Port | 否 | 1-65535 的整數 |
| IdentityFile | 否 | 有效路徑格式 |

#### Key Generator 表單
| 欄位 | 必填 | 驗證規則 |
|------|------|----------|
| Key Name | 是 | 字母、數字、底線、橫線，唯一性 |
| Key Type | 是 | ed25519 或 rsa |
| Comment | 否 | - |
| Passphrase | 否 | 至少 8 字元（如果填寫） |
| Confirm Passphrase | 條件性 | 與 Passphrase 相同 |

### 錯誤訊息模板
```
- 必填：「{欄位名稱} 為必填欄位」
- 格式：「{欄位名稱} 格式不正確」
- 唯一性：「此 {欄位名稱} 已存在」
- 範圍：「{欄位名稱} 必須介於 {min} 到 {max} 之間」
- 匹配：「兩次輸入的密碼不一致」
```

---

## UX Interaction Guidelines

### Loading States

#### 全頁載入
使用骨架屏（Skeleton）而非 spinner：
```jsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-muted rounded w-3/4" />
  <div className="h-4 bg-muted rounded w-1/2" />
</div>
```

#### 按鈕載入
- 顯示 spinner 圖示
- 文字改為進行中狀態
- 禁用按鈕防止重複提交

```jsx
<Button disabled={loading}>
  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {loading ? '處理中...' : '儲存'}
</Button>
```

### Feedback

#### Toast 通知
- **成功**：綠色左邊框，自動 3 秒後消失
- **錯誤**：紅色左邊框，需手動關閉
- **資訊**：藍色左邊框，自動 5 秒後消失

#### 操作確認
危險操作（刪除）需要確認對話框：
- 清楚說明將要執行的操作
- 強調不可逆的後果
- 使用紅色按鈕強調危險性

### Navigation

#### 側邊欄
- 固定寬度 256px
- 可收合（未來功能）
- 標籤頁切換有視覺回饋

#### 選中狀態
- 使用左邊框顏色指示當前選中項
- 背景色加深
- 適當的 transition 動畫

### Keyboard Shortcuts（規劃中）
| 快捷鍵 | 功能 |
|--------|------|
| `Cmd/Ctrl + N` | 新增主機/金鑰 |
| `Cmd/Ctrl + S` | 儲存 |
| `Delete` | 刪除選中項目 |
| `Escape` | 關閉對話框 |

---

## Animation Guidelines

### 過渡時間
- **快速**：150ms - hover 狀態
- **標準**：200ms - 展開/收合
- **慢速**：300ms - 頁面轉場

### 緩動函數
```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

### 動畫原則
1. 使用 `transform` 和 `opacity` 確保效能
2. 避免動畫過於花俏分散注意力
3. 提供減少動態效果的選項（`prefers-reduced-motion`）

---

## Accessibility

### 色彩對比
- 主要文字對比度 >= 7:1
- 次要文字對比度 >= 4.5:1
- 大型文字對比度 >= 3:1

### 鍵盤導航
- 所有互動元素可用 Tab 鍵訪問
- 焦點狀態清晰可見
- 對話框開啟時焦點鎖定

### Screen Reader
- 使用語義化 HTML
- 提供 `aria-label` 給圖示按鈕
- 錯誤訊息使用 `aria-describedby`

---

## File Structure

```
src/components/
├── ui/                    # shadcn/ui 基礎元件
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── hosts/                 # 主機相關元件
│   ├── HostList.tsx
│   ├── HostDetail.tsx
│   └── HostForm.tsx
├── keys/                  # 金鑰相關元件
│   ├── KeyList.tsx
│   ├── KeyDetail.tsx
│   └── KeyGenerator.tsx
├── common/                # 共用元件
│   ├── EmptyState.tsx
│   ├── Skeleton.tsx
│   └── Toast.tsx
└── AGENT.md               # 本設計規範文件
```

---

## Terminal Craft CSS Utilities

### 發光效果
```css
/* 標準發光 */
.terminal-glow { box-shadow: 0 0 20px hsl(120 100% 45% / 0.25); }

/* 小型發光 */
.terminal-glow-sm { box-shadow: 0 0 10px hsl(120 100% 45% / 0.15); }

/* 大型發光 */
.terminal-glow-lg { box-shadow: 0 0 30px hsl(120 100% 45% / 0.3); }

/* 文字發光 */
.text-glow { text-shadow: 0 0 10px hsl(120 100% 45% / 0.5); }
.text-glow-sm { text-shadow: 0 0 5px hsl(120 100% 45% / 0.3); }
```

### 終端機邊框
```css
/* 終端機風格邊框 */
.border-terminal { border: 1px solid hsl(120 100% 45% / 0.3); }
.border-terminal-active { border: 1px solid hsl(120 100% 45% / 0.6); }

/* 終端機卡片 */
.terminal-card {
  background: hsl(var(--card));
  border: 1px solid hsl(120 100% 45% / 0.2);
  box-shadow: 0 0 20px hsl(120 100% 45% / 0.1);
}
```

### 動畫
```css
/* 終端機脈衝（狀態指示燈） */
.animate-terminal-pulse {
  animation: terminal-pulse 2s ease-in-out infinite;
}

/* 游標閃爍 */
.animate-cursor {
  animation: blink-cursor 1s step-end infinite;
}
```

### 組件設計規範

#### TitleBar
- 帶發光的狀態指示燈
- `SSH_BUDDY` 使用底線風格命名
- 版本號使用小型 badge

#### HostList
- 索引編號 00, 01, 02...
- 選中項目帶 `terminal-glow-sm`
- hover 狀態帶微光效果

#### EmptyState
- 終端機風格裝飾 `> _ <`
- 標題使用 `// UPPER_CASE` 格式
- 按鈕使用 `[LABEL]` 格式

---

## Version History

| 版本 | 日期 | 變更 |
|------|------|------|
| 2.0.0 | 2025-12 | Terminal Craft 綠磷光主題 |
| 1.0.0 | 2024-12 | 初始設計規範 |
