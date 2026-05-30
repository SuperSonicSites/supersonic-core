param(
	[string] $OutputDir = "packages"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$themeSlug = "supersonic-site-theme"
$pluginSlug = "supersonic-site-core"
$themeSource = Join-Path $root "wp-content/themes/$themeSlug"
$pluginSource = Join-Path $root "wp-content/plugins/$pluginSlug"
$packageDir = Join-Path $root $OutputDir
$workDir = Join-Path $packageDir ".tmp"

function Assert-ChildPath {
	param(
		[string] $Parent,
		[string] $Child
	)

	$parentFull = [System.IO.Path]::GetFullPath($Parent).TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
	$childFull = [System.IO.Path]::GetFullPath($Child).TrimEnd('\', '/')

	if (-not $childFull.StartsWith($parentFull, [System.StringComparison]::OrdinalIgnoreCase)) {
		throw "Refusing to modify path outside package directory: $childFull"
	}
}

if (-not (Test-Path -LiteralPath $themeSource)) {
	throw "Theme source not found: $themeSource"
}

if (-not (Test-Path -LiteralPath $pluginSource)) {
	throw "Plugin source not found: $pluginSource"
}

New-Item -ItemType Directory -Force -Path $packageDir | Out-Null
if (Test-Path -LiteralPath $workDir) {
	Assert-ChildPath -Parent $packageDir -Child $workDir
	Remove-Item -LiteralPath $workDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $workDir | Out-Null

function Copy-PackageSource {
	param(
		[string] $Source,
		[string] $Destination
	)

	Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force

	Get-ChildItem -LiteralPath $Destination -Recurse -Force -Filter ".gitkeep" | Remove-Item -Force
	Get-ChildItem -LiteralPath $Destination -Recurse -Force -Filter "CLAUDE.md" | Remove-Item -Force
}

function New-WordPressZip {
	param(
		[string] $SourceDirectory,
		[string] $ZipPath,
		[string] $RootName
	)

	Add-Type -AssemblyName System.IO.Compression
	Add-Type -AssemblyName System.IO.Compression.FileSystem

	$sourceFull = [System.IO.Path]::GetFullPath($SourceDirectory).TrimEnd('\', '/')
	$archive = [System.IO.Compression.ZipFile]::Open($ZipPath, [System.IO.Compression.ZipArchiveMode]::Create)

	try {
		[void] $archive.CreateEntry("$RootName/")

		Get-ChildItem -LiteralPath $sourceFull -Recurse -Force -Directory | ForEach-Object {
			$relative = $_.FullName.Substring($sourceFull.Length).TrimStart('\', '/').Replace('\', '/')
			if ($relative) {
				[void] $archive.CreateEntry("$RootName/$relative/")
			}
		}

		Get-ChildItem -LiteralPath $sourceFull -Recurse -Force -File | ForEach-Object {
			$relative = $_.FullName.Substring($sourceFull.Length).TrimStart('\', '/').Replace('\', '/')
			$entryName = "$RootName/$relative"
			[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
				$archive,
				$_.FullName,
				$entryName,
				[System.IO.Compression.CompressionLevel]::Optimal
			) | Out-Null
		}
	} finally {
		$archive.Dispose()
	}
}

$themeStage = Join-Path $workDir $themeSlug
$pluginStage = Join-Path $workDir $pluginSlug

Copy-PackageSource -Source $themeSource -Destination $themeStage
Copy-PackageSource -Source $pluginSource -Destination $pluginStage

$themeZip = Join-Path $packageDir "$themeSlug.zip"
$pluginZip = Join-Path $packageDir "$pluginSlug.zip"

Remove-Item -LiteralPath $themeZip -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $pluginZip -Force -ErrorAction SilentlyContinue

New-WordPressZip -SourceDirectory $themeStage -ZipPath $themeZip -RootName $themeSlug
New-WordPressZip -SourceDirectory $pluginStage -ZipPath $pluginZip -RootName $pluginSlug

Assert-ChildPath -Parent $packageDir -Child $workDir
Remove-Item -LiteralPath $workDir -Recurse -Force

Write-Output "Created $themeZip"
Write-Output "Created $pluginZip"
