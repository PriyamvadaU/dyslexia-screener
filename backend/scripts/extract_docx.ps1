Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = 'C:/Users/pihuu/.gemini/antigravity/brain/83d8792e-fb69-46ff-8f26-012b8c1714fa/.user_uploaded/media_1791118029970.docx'
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$entry = $zip.GetEntry('word/document.xml')
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$content = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

[xml]$doc = $content
$ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
$ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
$pNodes = $doc.SelectNodes('//w:p', $ns)

$lines = @()
foreach ($p in $pNodes) {
    $tNodes = $p.SelectNodes('.//w:t', $ns)
    $text = ''
    foreach ($t in $tNodes) {
        $text += $t.InnerText
    }
    if ($text.Trim().Length -gt 0) {
        $lines += $text.Trim()
    }
}

$lines | Out-File -FilePath 'C:/Users/pihuu/.gemini/antigravity/scratch/dyslexia-screener/backend/data/extracted_docx_lines.txt' -Encoding utf8
Write-Output "Extracted $($lines.Count) lines to extracted_docx_lines.txt"
