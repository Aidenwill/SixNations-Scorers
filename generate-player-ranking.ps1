# Script to generate a ranked table of players by total points from scoring data
# Reads player scores JSON and outputs a formatted ranking to console and file

# Input and output file paths
$jsonFilePath = "score_per_player.json"
$outputFilePath = "player_ranking.txt"

# Check if input file exists
if (-not (Test-Path $jsonFilePath)) {
    Write-Error "Input file '$jsonFilePath' not found. Please run the scoring script first."
    exit 1
}

Write-Host "Loading player data from $jsonFilePath..."

# Read and parse the JSON file containing player scores
try {
    $players = Get-Content $jsonFilePath -Raw | ConvertFrom-Json
    Write-Host "Successfully loaded $($players.Count) players from JSON file."
} catch {
    Write-Error "Failed to read or parse JSON file: $_"
    exit 1
}

# Validate that we have player data
if (-not $players -or $players.Count -eq 0) {
    Write-Warning "No player data found in $jsonFilePath"
    exit 0
}

Write-Host "Sorting players by total points..."

# Sort players by total points in descending order
$sortedPlayers = $players | Sort-Object -Property total -Descending

# Display top players in traces
$topPlayers = $sortedPlayers | Select-Object -First 5
Write-Host "Top 5 players by points:"
foreach ($player in $topPlayers) {
    $playerName = if ($player.name) { $player.name } else { "Unknown Player" }
    Write-Host "  - $playerName ($($player.team)): $($player.total) points"
}

# Function to format the ranking table
function Format-RankingTable {
    param([array]$sortedPlayers)

    $table = @()
    $table += "=== PLAYER RANKING BY POINTS ==="
    $table += "Position | Name                     | Team      | Total"
    $table += "-----------------------------------------------------"

    $position = 1
    foreach ($player in $sortedPlayers) {
        # Handle cases where name might be null
        $playerName = if ($player.name) { $player.name } else { "Unknown" }
        $line = "{0, -7} | {1, -23} | {2, -8} | {3, -5}" -f $position, $playerName, $player.team, $player.total
        $table += $line
        $position++
    }

    return $table
}

# Generate the formatted ranking
$classement = Format-RankingTable -sortedPlayers $sortedPlayers

# Display the ranking to console
Write-Host "Player Ranking by Total Points:"
Write-Host ""
$classement | ForEach-Object { Write-Host $_ }

# Save the ranking to file
try {
    $classement | Out-File $outputFilePath -Encoding utf8
    Write-Host "`nRanking saved to $outputFilePath"
} catch {
    Write-Error "Failed to save ranking to file: $_"
}
