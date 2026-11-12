param([switch]$Once)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1)
function Await($op, $type) {
 $task = $asTask.MakeGenericMethod($type).Invoke($null, @($op)); $task.GetAwaiter().GetResult()
}
try {
 $manager = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
 while ($true) {
  try {
   $session = $manager.GetCurrentSession()
   if ($null -eq $session) { @{title='';artist='';playing=$false;source='';position=0;duration=0;cover=''} | ConvertTo-Json -Compress }
   else {
    $props = Await ($session.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
    $timeline = $session.GetTimelineProperties()
    $sampledAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $timelineUpdatedAt = 0
    try { $timelineUpdatedAt = ([DateTimeOffset]$timeline.LastUpdatedTime).ToUnixTimeMilliseconds() } catch {}
    $playback = $session.GetPlaybackInfo()
    $rate = 1.0
    if ($null -ne $playback.PlaybackRate) { $rate = [double]$playback.PlaybackRate }
    $playing = $playback.PlaybackStatus.ToString() -eq 'Playing'
    $cover = ''
    if ($props.Thumbnail) {
     $stream = $null; $buffer = $null; $managed = $null
     try {
      $stream = Await ($props.Thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
      # Invoke through the declared WinRT interface: PowerShell can receive __ComObject.
      $randomAccess = [Windows.Storage.Streams.IRandomAccessStream]
      $size = $randomAccess.GetProperty('Size').GetValue($stream, $null)
      if ($size -gt 0 -and $size -lt 4000000) {
       $managed = ([System.IO.WindowsRuntimeStreamExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsStream' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IRandomAccessStream' } | Select-Object -First 1).Invoke($null, @($stream))
       $buffer = New-Object System.IO.MemoryStream
       $managed.CopyTo($buffer)
       $contentType = [Windows.Storage.Streams.IContentTypeProvider].GetProperty('ContentType').GetValue($stream, $null)
       $cover = 'data:' + $contentType + ';base64,' + [Convert]::ToBase64String($buffer.ToArray())
      }
     } catch {
      # A missing or unreadable thumbnail must never discard song metadata.
      $cover = ''
     } finally {
      if ($buffer) { $buffer.Dispose() }
      if ($managed) { $managed.Dispose() }
     }
    }
    @{title=$props.Title;artist=$props.Artist;album=$props.AlbumTitle;source=$session.SourceAppUserModelId;playing=$playing;position=($timeline.Position-$timeline.StartTime).TotalSeconds;sampledAt=$sampledAt;timelineUpdatedAt=$timelineUpdatedAt;playbackRate=$rate;duration=($timeline.EndTime-$timeline.StartTime).TotalSeconds;cover=$cover} | ConvertTo-Json -Compress
   }
  } catch { @{error=$_.Exception.Message} | ConvertTo-Json -Compress }
  if ($Once) { break }
  Start-Sleep -Milliseconds 1200
 }
} catch { @{error=$_.Exception.Message} | ConvertTo-Json -Compress; exit 1 }
