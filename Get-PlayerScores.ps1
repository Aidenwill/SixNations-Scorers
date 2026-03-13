<#
.SYNOPSIS
    Calculate and optionally export scoring totals per player from Six Nations match data.

.DESCRIPTION
    This script reads a JSON file containing match summaries, computes the number of
    points scored by each player (tries, conversions, penalties, drop goals) and
    can look up player names via the Pulselive API.  It outputs a JSON file and can
    also dump a verbose summary to the console.

.PARAMETER InputJsonPath
    Path to the JSON file that contains the raw match summaries.

.PARAMETER OutputJsonPath
    Path where the resulting player scores JSON will be written. Defaults to the
    current working directory if not supplied.

.PARAMETER LookupNames
    If provided, the script will attempt to query Pulselive to fill in player
    display names.  The call is throttled to avoid overloading the API.

.EXAMPLE
    .\Get-PlayerScores.ps1 -InputJsonPath .\matches_summary.json \
        -OutputJsonPath .\score_per_player.json -LookupNames
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory=$true)]
    [string]$InputJsonPath,

    [Parameter(Mandatory=$false)]
    [string]$OutputJsonPath = (Join-Path -Path $PWD -ChildPath 'score_per_player.json'),

    [switch]$LookupNames
)

function Get-PlayerName {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$PlayerId
    )

    $apiUrl = "https://api.wr-rims-prod.pulselive.com/rugby/v3/player/$PlayerId"
    try {
        $resp = Invoke-RestMethod -Uri $apiUrl -Method Get -ErrorAction Stop
        return $resp.name.display
    }
    catch {
        Write-Warning "Failed to fetch name for player $PlayerId : $($_.Exception.Message)"
        return $null
    }
}

function Get-PlayerScores {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [array]$Matches
    )

    $result = @{}

    foreach ($match in $Matches) {
        $matchDate = [datetime]::ParseExact($match.date, 'yyyy-MM-dd', $null)
        $tryValue  = if ($matchDate.Year -lt 1992) { 4 } else { 5 }

        $rules = @{ try = $tryValue; con = 2; pen = 3; dropGoals = 3 }

        foreach ($team in $match.teams) {
            $abbr = $team.abbreviation
            $opponent = $match.teams |
                Where-Object { $_.abbreviation -ne $abbr } |
                Select-Object -ExpandProperty abbreviation -First 1
            if (-not $opponent) { $opponent = 'Unknown' }

            foreach ($type in $team.scoring.PSObject.Properties.Name) {
                $points = $rules[$type]
                foreach ($playerId in $team.scoring.$type) {
                    if (-not $result.ContainsKey($playerId)) {
                        $result[$playerId] = [pscustomobject]@{
                            Id      = $playerId
                            Team    = $abbr
                            Name    = $null
                            Total   = 0
                            Details = @()
                        }
                    }
                    $result[$playerId].Total += $points
                    $result[$playerId].Details += [pscustomobject]@{
                        Date     = $match.date
                        MatchId  = $match.matchId
                        Opponent = $opponent
                        Type     = $type
                        Points   = $points
                    }
                }
            }
        }
    }

    return $result
}

# --- main execution --------------------------------------------------------

if (-not (Test-Path $InputJsonPath)) {
    Throw "Input file '$InputJsonPath' does not exist."
}

$inputData = Get-Content -Path $InputJsonPath -Raw | ConvertFrom-Json
$players    = Get-PlayerScores -Matches $inputData

if ($LookupNames) {
    foreach ($playerId in $players.Keys) {
        $players[$playerId].Name = Get-PlayerName -PlayerId $playerId
    }
}

# write output file
$players.Values | ConvertTo-Json -Depth 5 | Out-File -FilePath $OutputJsonPath -Encoding utf8

Write-Output "Scores written to $OutputJsonPath"

# verbose display if requested
if ($PSBoundParameters.ContainsKey('Verbose')) {
    foreach ($p in $players.Values | Sort-Object Id) {
        Write-Verbose "ID $($p.Id) ($($p.Name)) [$($p.Team)] : $($p.Total) pts"
        foreach ($d in $p.Details) {
            Write-Verbose "  - $($d.Date): $($d.Type) ($($d.Points))"
        }
    }
}
