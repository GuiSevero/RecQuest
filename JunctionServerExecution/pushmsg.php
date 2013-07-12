<?php
  // create message file (a random file starting with MSG)
  $fname = tempnam("current/MSG", "MSG");  

  $handle = fopen($fname, "w");
  fwrite($handle, $_POST["MSG"]);
  fclose($handle);
  
  // copy when all message has been saved
  //$fname2 = tempnam("current/MSG", "MSG");
  //rename($fname, $fname2);
  
  //unlink($fname);
  
?>
OK