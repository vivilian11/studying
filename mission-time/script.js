  const hourEl=document.getElementById("hour");
  const minuteEl=document.getElementById("minute");
  const secondEl=document.getElementById("second");
  const ampmEl=document.getElementById("ampm");
  function updateClock(){
    let hours=new Date().getHours();
    const minutes=new Date().getMinutes();
    const seconds=new Date().getSeconds();
    let ampm="AM";
    if(hours==0){
      hours=12;
    }
    else if(hours==12){
      ampm="PM";
    }
    else if(hours>12){
      hours=hours-12;
      ampm="PM";
    }
    hourEl.innerText=formatTime(hours);
    minuteEl.innerText=formatTime(minutes);
    secondEl.innerText=formatTime(seconds);
    ampmEl.innerText=ampm;
  }
  function formatTime(time){
    return time<10?`0${time}`:time;
  }
    setInterval(updateClock,1000);
    updateClock();