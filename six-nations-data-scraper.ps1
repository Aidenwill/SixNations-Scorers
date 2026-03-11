# Script to scrape rugby match data from World Rugby API for Six Nations and Five Nations competitions
# Outputs player scoring data to a JSON file

# Output file path
$outputFile = "six-nations-scoring-data.json"
# Checkpoint file to track progress
$checkpointFile = "six-nations-scraper-checkpoint.json"
# Array to hold all match results
$results = @()
# Minimum date to start scraping from (1971 when try value changed from 3 to 4 points)
$minDate = [datetime]::Parse("1971-01-01")

# Load existing data if output file exists to avoid re-processing
if (Test-Path $outputFile) {
    $existingData = Get-Content $outputFile | ConvertFrom-Json
    if ($existingData) {
        $results = $existingData
    }
}

# Load checkpoint data to resume from where we left off
$checkpoint = @{
    processedSequential = 249  # Start before 250
    processedUuids = @()
}
if (Test-Path $checkpointFile) {
    $checkpointData = Get-Content $checkpointFile | ConvertFrom-Json
    if ($checkpointData) {
        $checkpoint = $checkpointData
    }
}

# Progress tracking
$matchesProcessed = 0
$totalSequentialMatches = 32000 - 250 + 1  # 31751 matches

# Specific match IDs for Six Nations 2025-2026 (World Rugby uses UUIDs for recent matches)
$matchIds = @(
    "a8eecba9-e813-4e8a-ae2a-a207d74b8608",
    "08bd5f43-cbde-48d9-b7b0-ab076c1bc391",
    "b15fe628-35cb-4afd-b191-7d7f657d6a69",
    "54271c21-9fed-472d-ac7d-eefdea250e8d",
    "8516f1ed-09df-485e-ab17-4a8df65240c4",
    "96c31f03-3868-4bf1-bd92-d9edf1b1ed33",
    "52d0b20e-61f9-4946-a9f3-d36b2e89e530",
    "bc247f11-5aaf-483d-8b0f-1b7af644ce33",
    "80c5c30e-4706-4f41-85ef-66cc5427a0a9",
    "12738a82-a6da-4912-92d6-760b47b2f312",
    "c795a5c3-58bf-4f9b-8e38-6507c0d2798c",
    "57a82407-72d8-4fab-8905-f963d116c3ef",
    "8f26e055-bf73-4e59-92d3-da688fda4a87",
    "c25762bc-451b-46d2-9c3f-04db15b6d73b",
    "e708be62-87c4-4725-b750-52e6d5b29378",
    "92b73b38-dc79-4dc7-8c27-e1476d84ed72",
    "0c4b1bb6-6477-4a25-95c4-417e672c4638",
    "d1dbb1eb-32b4-4aa8-87c2-ad129aa3c7bb",
    "195f7ef5-099b-42b8-a755-ecd3c82ec8f7",
    "b7b7e725-23eb-4c13-ae07-96024b2fafba",
    "982ad030-632d-457c-8536-50e973b83ff6",
    "2c3ca690-1a66-4a41-8017-0abcf2c052b6",
    "6d1bcf81-afc3-49c1-a82a-86658d9a3294",
    "90f35611-bca8-4535-bcad-9a4760c14f46",
    "f8151d33-7687-4240-ad86-9b71a11768ca",
    "6669956c-2c93-4d03-9554-715fafdbed06",
    "2a29de97-b006-4987-9cbb-4cb88dcc453d"
)

$totalUuidMatches = $matchIds.Count  # 24 matches

# Counter for periodic saves
$saveCounter = 0

# Function to save checkpoint
function SaveCheckpoint {
    $checkpoint | ConvertTo-Json | Out-File $checkpointFile
}

# Function to save results periodically
function SaveResults {
    $script:results | ConvertTo-Json -Depth 5 | Out-File $outputFile
    Write-Host "Progress saved to $outputFile"
}

# Function to display progress
function ShowProgress {
    param($currentId, $total, $type)
    $percentage = [math]::Round(($currentId / $total) * 100, 1)
    Write-Host "Progress: $currentId / $total ($percentage%) - $type matches processed"
}

# Function to process scoring data for a team
function ProcessTeamScoring {
    param($teamScoring)
    $output = @{}
    foreach ($type in $teamScoring.PSObject.Properties.Name) {
        $playerIds = @()
        foreach ($scoreEvent in $teamScoring.$type) {
            if ($scoreEvent.playerId) {
                $playerIds += $scoreEvent.playerId
            }
        }
        $output[$type] = $playerIds
    }
    return $output
}

# Function to process a single match by ID
function ProcessMatch {
    param($matchId)
    # Build API URL for the match
    $url = "https://api.wr-rims-prod.pulselive.com/rugby/v3/match/$matchId/summary"

    try {
        # Fetch match data from API
        $response = Invoke-RestMethod -Uri $url -Method Get -ContentType "application/json" -ErrorAction Stop

        $competition = $response.match.competition
        $matchDate = [datetime]::Parse($response.match.time.label)
        # Filter for Six/Five Nations matches from min date onwards
        if ($competition -match "^Five Nations|^Six Nations" -and $matchDate -ge $minDate) {
            # Ensure both teams are Six Nations teams
            if(($response.match.teams[0].name -match "England|France|Wales|Scotland|Ireland|Italy") -and ($response.match.teams[1].name -match "England|France|Wales|Scotland|Ireland|Italy")) {

                # Create structured data object for the match
                $filteredData = @{
                    date = $response.match.time.label
                    competition = $competition
                    teams = @(
                        @{
                            abbreviation = $response.match.teams[0].name
                            scoring = ProcessTeamScoring $response.teams[0].scoring
                        },
                        @{
                            abbreviation = $response.match.teams[1].name
                            scoring = ProcessTeamScoring $response.teams[1].scoring
                        }
                    )
                }

                # Add to results array
                $script:results += $filteredData
                Write-Host "Match $matchId added: $competition"

                # Update progress counter
                $script:matchesProcessed++

                # Show progress every 100 matches
                if ($script:matchesProcessed % 100 -eq 0) {
                    Write-Host "Total matches processed so far: $script:matchesProcessed"
                }

                # Update save counter and save periodically
                $script:saveCounter++
                if ($script:saveCounter -ge 10) {
                    SaveResults
                    $script:saveCounter = 0
                }
            }
        }
    }
    catch {
        Write-Host "Error for match $matchId : $($_.Exception.Message)"
    }
}

# Process sequential match IDs (historical matches), resuming from checkpoint
Write-Host "Starting sequential matches processing from $($checkpoint.processedSequential + 1) to 32000..."
for ($matchId = $checkpoint.processedSequential + 1; $matchId -le 32000; $matchId++) {
    ProcessMatch $matchId
    # Update checkpoint for sequential matches
    $checkpoint.processedSequential = $matchId
    SaveCheckpoint

    # Show progress for sequential matches every 500 matches
    if ($matchId % 500 -eq 0) {
        ShowProgress ($matchId - 249) $totalSequentialMatches "Sequential"
    }
}
Write-Host "Sequential matches processing completed."

# Process specific match IDs (recent matches with UUIDs), skipping already processed
Write-Host "Starting UUID matches processing ($totalUuidMatches matches)..."
$uuidProcessed = 0
foreach ($matchId in $matchIds) {
    if ($matchId -notin $checkpoint.processedUuids) {
        ProcessMatch $matchId
        # Mark as processed
        $checkpoint.processedUuids += $matchId
        SaveCheckpoint
        $uuidProcessed++
    } else {
        Write-Host "Skipping already processed match: $matchId"
    }
}
Write-Host "UUID matches processing completed. Processed $uuidProcessed new matches."

# Final save of results
SaveResults
Write-Host "Script execution completed!"
Write-Host "Total matches processed in this run: $matchesProcessed"
Write-Host "Total matches in results: $($results.Count)"
Write-Host "Export completed to $outputFile"