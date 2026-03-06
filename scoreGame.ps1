# Six Nations Player Scoring Game
# A quiz game where players guess which rugby player has scored more points

# File paths
$jsonFilePath = "score_per_player.json"
$highScoresFilePath = "highscores.json"

# Check if player data file exists
if (-not (Test-Path $jsonFilePath)) {
    Write-Error "Player data file '$jsonFilePath' not found. Please run the scoring script first."
    exit 1
}

# Load player data
try {
    $players = Get-Content $jsonFilePath -Raw | ConvertFrom-Json
    Write-Host "Loaded $($players.Count) players from $jsonFilePath"
} catch {
    Write-Error "Failed to load player data: $_"
    exit 1
}

# Validate player data
if (-not $players -or $players.Count -lt 2) {
    Write-Error "Not enough player data found. Need at least 2 players to play."
    exit 1
}

# Load or initialize high scores
$highScores = @()
if (Test-Path $highScoresFilePath) {
    try {
        $highScores = Get-Content $highScoresFilePath -Raw | ConvertFrom-Json
    } catch {
        Write-Warning "Failed to load high scores, starting fresh: $_"
        $highScores = @()
    }
}

# Function to display player details
function Show-PlayerDetails {
    param($player)
    Write-Host "`nDetails for $($player.name) ($($player.team)):"
    Write-Host "Total: $($player.total) points"
    Write-Host "Scoring history:"
    $player.details | ForEach-Object {
        Write-Host "  - $($_.date): $($_.points) points ($($_.type))"
    }
}

# Function to get a random player different from current one with different score
function Get-RandomDifferentPlayer {
    param($currentPlayer)
    $attempts = 0
    $maxAttempts = 100

    do {
        $randomPlayer = $players | Get-Random
        $attempts++
        if ($attempts -ge $maxAttempts) {
            Write-Warning "Could not find a different player after $maxAttempts attempts."
            return $null
        }
    } while ($randomPlayer.id -eq $currentPlayer.id -or $randomPlayer.total -eq $currentPlayer.total)

    return $randomPlayer
}

# Function to play a round
function Play-Round {
    param($player1, $player2, [ref]$streak)

    Write-Host "`n--- New Round ---"
    Write-Host "Who has scored more points?"
    Write-Host "1. $($player1.name) ($($player1.team))"
    Write-Host "2. $($player2.name) ($($player2.team))"

    $choice = Read-Host "Choose 1 or 2 (or 'q' to quit)"

    # Allow quitting
    if ($choice -eq 'q') {
        return 'quit'
    }

    # Validate input
    if ($choice -ne '1' -and $choice -ne '2') {
        Write-Host "Invalid choice. Please enter 1 or 2."
        return 'invalid'
    }

    # Determine winner and loser
    if ($player1.total -gt $player2.total) {
        $winner = $player1
        $loser = $player2
    } else {
        $winner = $player2
        $loser = $player1
    }

    $isCorrect = ($choice -eq "1" -and $winner -eq $player1) -or ($choice -eq "2" -and $winner -eq $player2)

    if ($isCorrect) {
        Write-Host "Correct answer!"
        $streak.Value++
        Write-Host "Current streak: $($streak.Value) consecutive correct answers."
    } else {
        Write-Host "Wrong answer!"
        Write-Host "The correct answer was: $($winner.name) with $($winner.total) points"
        $streak.Value = 0
    }

    # Show details
    Show-PlayerDetails $player1
    Show-PlayerDetails $player2

    Write-Host "`nWinner: $($winner.name) with $($winner.total) points!"

    # Return both winner and loser
    return @{
        winner = $winner
        loser = $loser
        isCorrect = $isCorrect
    }
}

# Function to save high score
function Save-HighScore {
    param($name, $score)

    if ($score -le 0) {
        return
    }

    $newEntry = @{
        name = $name
        score = $score
        date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }

    # Use global variable
    $script:highScores += $newEntry

    try {
        $script:highScores | ConvertTo-Json -Depth 5 | Out-File $highScoresFilePath -Encoding utf8
        Write-Host "`nNew high score saved: $score points!"
    } catch {
        Write-Warning "Failed to save high score: $_"
    }
}

# Function to display high scores
function Show-HighScores {
    Write-Host "`n--- High Scores ---"
    if ($highScores.Count -eq 0) {
        Write-Host "No high scores recorded yet."
    } else {
        $highScores | Sort-Object -Property score -Descending | Select-Object -First 10 | ForEach-Object {
            Write-Host "$($_.name): $($_.score) points ($($_.date))"
        }
    }
}

# Main game loop
Write-Host "Welcome to the Six Nations Player Scoring Quiz!"
Write-Host "Guess which player has scored more points in Six Nations history."
Write-Host "Players can only stay for 2 consecutive rounds before being replaced!"
Write-Host "Enter 'q' at any time to quit."
Write-Host ""

$playerName = Read-Host "Enter your name for score tracking"

# Start with two random players
$currentPlayer = $players | Get-Random
$opponentPlayer = Get-RandomDifferentPlayer $currentPlayer
$streak = 0
$roundsPlayed = 0
$consecutiveRounds = 0  # Track how many rounds the current player has been there

# Safety check for initial players
if (-not $opponentPlayer) {
    Write-Error "Could not find an initial opponent. Not enough players with different scores."
    exit 1
}

# Game loop
while ($true) {
    $roundsPlayed++
    Write-Host "`nRound $roundsPlayed - Current streak: $streak"

    $result = Play-Round $currentPlayer $opponentPlayer ([ref]$streak)

    if ($result -eq 'quit') {
        Write-Host "Thanks for playing!"
        break
    }

    if ($result -eq 'invalid') {
        $roundsPlayed--  # Don't count invalid rounds
        continue
    }

    $winner = $result.winner
    $loser = $result.loser

    # Check if current player has been here for 2 consecutive rounds
    if ($winner -eq $currentPlayer) {
        $consecutiveRounds++
        if ($consecutiveRounds -ge 2) {
            # Current player has stayed 2 rounds, replace them even though they won
            Write-Host "$($currentPlayer.name) has stayed for 2 rounds and gets replaced!"
            $currentPlayer = Get-RandomDifferentPlayer $winner  # Get someone different from the winner
            if (-not $currentPlayer) {
                Write-Warning "Could not find a replacement player. Ending game."
                break
            }
            $consecutiveRounds = 0
            Write-Host "New player: $($currentPlayer.name) enters the tournament!"
        } else {
            # Winner stays, replace the loser
            $opponentPlayer = Get-RandomDifferentPlayer $currentPlayer
            if (-not $opponentPlayer) {
                Write-Warning "Could not find a new opponent for $($currentPlayer.name). Ending game."
                break
            }
        }
    } else {
        # Opponent won, they become current player, replace the old current player
        $currentPlayer = $winner
        $opponentPlayer = Get-RandomDifferentPlayer $currentPlayer
        $consecutiveRounds = 1  # New player starts with 1 consecutive round
        if (-not $opponentPlayer) {
            Write-Warning "Could not find a new opponent for $($currentPlayer.name). Ending game."
            break
        }
    }

    if ($consecutiveRounds -lt 2) {
        Write-Host "Next round: $($currentPlayer.name) stays vs $($opponentPlayer.name)!"
    }
}

# Save high score if achieved
if ($streak -gt 0) {
    Save-HighScore $playerName $streak
}

# Show final stats and high scores
Write-Host "`nGame Summary:"
Write-Host "Rounds played: $roundsPlayed"
Write-Host "Final streak: $streak"

Show-HighScores

Write-Host "`nThanks for playing, $playerName!"
