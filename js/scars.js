// using user's position ,  to localise places ,  search ,  get full format address,  and postal code
// then using geocoder get lat lon of from
// added array based initialization so that fillInAddress works properly
// the meat is in bookingloc
// implemented waypoints ,  added session and localStorage exosekeltion will implement later
// way points are implemented but mileage needs to be calculated
//fare calculator as per vehicle type functional ,  value dumped in 'total' div
//To Do data validation for null
//getlocation from map page is populated in FROM in initialize() using sessionStorage
//properly populating bookingloc with session storage ;
//set favourites in an array and save as local storage (checks if it exists then read in , else initialize it)
//run lint, differentiate for i variables define them,some missing semicolons
//separate js, js moved to just before end of body
//anas catch an error in removeElement sorted because of strText;live debugging reveals the problem ,it's fixed
//date and time validation for null and past bookings 
//further data validation tel ,fare ,vehicletype must not be null
// check box for asap // if checked then manual entry is hidden else reappear
//NEED TO TEST FOLLOWING
//long mileage start limit and long mileage rate
//source cannot be same as destination
//return booking 
//whenever any autcomplete field change ,it triggers calcRoute(), the default vehicle is SALOON
//default job type is ASAP hiding clock and calendar
//todo
//when get repeat booking trigger calcRoute
//when change vehicle trigger calcroute as event handler for change
//unique repeat bookings and favourites no duplicates
//if no favourite saved then hide get favourite and delete favorite
//if no repeat booking then hide repeat booking
//trigger calcRoute on get favorite
////////////// testing connectivity with dream factory calling it from clean up to redirect to sdk index
// we have to convert datentimestamp to string so that mongo can store it properly this will be kept in mind when parsing


var autocomplete=[], bookingloc=[], numofvia=0, directionsDisplay, calculatedfare=0;//must save fare on going to other page else lost 
var jobmileage;
var baserate=2.5, minfare=5, longmilestartsfrom=60;longmileagerate=2;//can be getten from the server
var directionsService = new google.maps.DirectionsService();
var myfavy=[];//global cache for favourites
var myoldbookings=[];//global cache for oldbookings
var activebookinghist=[];//global cache for active booking
var telcust;//customer telephone
var vehicleclass;
var emailmevar;
var jobref,drvnote="";
function initialize() {
  // Create the autocomplete object,  restricting the search
  // to geographical location types.
  autocomplete[0] = new google.maps.places.Autocomplete(
      /** @type {HTMLInputElement} */(document.getElementById('autocomplete')), 
      { types: ['geocode'] });
  
autocomplete[1] = new google.maps.places.Autocomplete(
      /** @type {HTMLInputElement} */(document.getElementById('autocomplete1')), 
      { types: ['geocode'] });
      
  
      
var len = autocomplete.length;
for (var ik=0; ik<len; ++ik) {
 
    var s = autocomplete[ik];
    google.maps.event.addListener(s,  'place_changed',  function() {
    fillInAddress(this);
  });
  }
directionsDisplay = new google.maps.DirectionsRenderer();

//////check if there is stored email and telephone if so populate it in their fields
if(window.localStorage.email)//if it exist read in
  {
     emailmevar=JSON.parse(window.localStorage.email);
    // document.getElementById('emailme').value=emailmevar;
   }
    




if(window.localStorage.tel)//if it exist read in
  {
     telcust=JSON.parse(window.localStorage.tel);
     //document.getElementById('telme').value=telcust;
   }
    
  
//////////check if there is value in session storage from draggable markers


if(window.sessionStorage.ssdragmapfrom){
 var dragmapfrom= JSON.parse(window.sessionStorage.ssdragmapfrom);
document.getElementById('autocomplete').value=dragmapfrom.address;
   bookingloc[0]=dragmapfrom;
//test code end
}

//////////check if there is value in session storage from draggable markers for TO
if(window.sessionStorage.ssdragmapto){
  var dragmapto= JSON.parse(window.sessionStorage.ssdragmapto);
document.getElementById('autocomplete1').value=dragmapto.address;
 bookingloc[1]=dragmapto;
//test code end
}

initasaphidecalnclock();  
nomyoldbookings();
//nofavy();
}
//////////////////////////////////////////////  


//binding dynamically added via fields to map object
function viafieldbind(myvia)
{
var myviaindex =myvia+1;
var autoget='autocomplete'+myviaindex;
autocomplete[myviaindex] = new google.maps.places.Autocomplete(
      /** @type {HTMLInputElement} */(document.getElementById(autoget)), 
      { types: ['geocode'] });
      var s1=autocomplete[myviaindex];
  google.maps.event.addListener(s1,  'place_changed',  function() {
    fillInAddress(this);
  });
 }

// [START region_fillform]
function fillInAddress(i) {
  

  // Get the place details from the autocomplete object.
 var addaray={};
 var j=autocomplete.indexOf(i);//what is the index of i in autocomplete array remember i= this (self pointer to array value)
  
    
    var place = i.getPlace();
    var address = place.formatted_address;
    
    //the order is important it needs to be before geocoder
    
    //checking types in place.address_components for postal code
 addaray["address"] = address;
 place.address_components.forEach(function(entry){
   if(entry.types=="postal_code"){
     addaray["postcode"]=entry["long_name"];
  }
 });
  
 if(addaray["postcode"].length==0)
 {
 alert("exact address not given so quote is just rough estimate");
 }
 
    
    
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode( { 'address': address},  function(results,  status) {
    if (status == google.maps.GeocoderStatus.OK) {
       addaray["lat"]=results[0].geometry.location.k; 
       addaray["lon"]=results[0].geometry.location.B; 
       //https://developers.google.com/maps/documentation/javascript/geocoding
       
       }
     else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
 
 
  bookingloc[j]=addaray;//dumping entire array lat@ lon @full @address @postcode
  calcRoute();//whenever filed changes it calculates for fare [saloon is selected by default]
  }
// [END region_fillform]

// [START region_geolocation]
// Bias the autocomplete object to the user's geographical location, 
// as supplied by the browser's 'navigator.geolocation' object.
function geolocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var geolocation = new google.maps.LatLng(
          position.coords.latitude,  position.coords.longitude);
      autocomplete[0].setBounds(new google.maps.LatLngBounds(geolocation, 
          geolocation));
    });
  }
}
// [END region_geolocation]
/////////////////////////////////////////////////////////////
///////////////add and remove logic/////////////////////////

            //FUNCTION TO ADD TEXT BOX ELEMENT
            function addElement()
            {   
                numofvia = numofvia + 1;
                var contentID = document.getElementById('content');
                var newTBDiv = document.createElement('div');
                var autonumofvia=numofvia+1;
                newTBDiv.setAttribute('id', 'strText'+numofvia);
                
    newTBDiv.innerHTML = "Via "+numofvia+": <input type='text' id='autocomplete"+autonumofvia+"' name='"+autonumofvia+"'/ >";
    
                contentID.appendChild(newTBDiv);
                viafieldbind(numofvia);   
            }
            //FUNCTION TO REMOVE TEXT BOX ELEMENT
            function removeElement()
            {
                if(numofvia !== 0)
                {
		  //all via are enlcosed in strText div's 
                    var autonumofviar=numofvia;
                    var autogetr='strText'+autonumofviar;
                    var elem= document.getElementById(autogetr);
		    elem.parentNode.removeChild(elem);
		    numofvia = numofvia-1;
                }
            }



//////calculate distance using gmap directionsDisplay
function calcRoute()
{
      //check if user has blanked the field
  
  if(document.getElementById('autocomplete').value===""){
    alert("Please input 'From'");
    document.getElementById('total').innerHTML="";
    return;
    
  }
  if(document.getElementById('autocomplete1').value===""){
    alert("Please input 'To'");
    document.getElementById('total').innerHTML="";
    return;
    
  }
    ///check end
 if (typeof bookingloc[0]=='undefined'){document.getElementById('total').innerHTML = "";return;}
 if (typeof bookingloc[1]=='undefined'){document.getElementById('total').innerHTML ="";return;}
  var start = bookingloc[0].address;
  var end = bookingloc[1].address;
  var waypts = [];
  
  for (var ki = 0; ki < numofvia; ki++) {
      var viaindexinbook=ki+2;
      waypts.push({
          location:bookingloc[viaindexinbook].address, 
          stopover:true});
    
  }

  var request = {
      origin: start, 
      destination: end, 
      waypoints: waypts, 
      optimizeWaypoints: true, 
      travelMode: google.maps.TravelMode.DRIVING
  };
  directionsService.route(request,  function(response,  status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
      computeTotalDistance(directionsDisplay.getDirections());
     bookingsavetolocalstorage();//save bookings to localstorage as history
     // var route = response.routes[0];
     // var summaryPanel = document.getElementById('directions_panel');
     // summaryPanel.innerHTML = '';
      // For each route,  display summary information.
     // for (var i = 0; i < route.legs.length; i++) {
       // var routeSegment = i + 1;
       // summaryPanel.innerHTML += '<b>Route Segment: ' + routeSegment + '</b><br>';
       // summaryPanel.innerHTML += route.legs[i].start_address + ' to ';
       // summaryPanel.innerHTML += route.legs[i].end_address + '<br>';
       // summaryPanel.innerHTML += route.legs[i].distance.text + '<br><br>';
     // }
    }
  });
}

/////////mileage calculate
function computeTotalDistance(result) {
  var total = 0, resultr=0;
  var myroute = result.routes[0];
  for (var ic = 0; ic < myroute.legs.length; ic++) {
	total += myroute.legs[ic].distance.value;
  }
  total = total / 1000.0;
  total = total * 0.62;//km to miles
  resultr=total.toFixed(1);
  jobmileage=resultr;
  var costofjourney= (resultr*baserate);//base rate
  if( resultr > longmilestartsfrom){ costofjourney=resultr*longmileagerate;} //for long journey, lower base rate
  
  if (costofjourney < minfare){ costofjourney=minfare;} //minimum fare
  var costofestate =  costofjourney+5; //£5 on the top
  var costofmpv = costofjourney*1.5; //fare and a half
  var costofexecutive= costofjourney*1.8; //80% more than normal
  var Costofwaitnreturn= costofjourney*1.5;
  //optionval=parseInt(document.getElementById('vehicletype').selectedIndex);redundant code
  var optionval=document.getElementById('vehicletype').selectedIndex;
  var istringval="";
//    var img = document.createElement("IMG");
  
  switch( optionval)
 {
case 0:
  istringval = "Cost is £"+ costofjourney.toFixed(2);
  calculatedfare=costofjourney.toFixed(2);
  vehicleclass="S";
//  img = "images/SALOON.png";
 break;
case 1:
 istringval = "Cost is £"+ costofestate.toFixed(2);
 calculatedfare=costofestate.toFixed(2);
 vehicleclass="E";
 // img= "images/ESTATE.png";
 break;
case 2:
  istringval ="Cost is £"+ costofexecutive.toFixed(2);
  calculatedfare=costofexecutive.toFixed(2);
  vehicleclass="X";
//  img = "images/EXECUTIVE.png";
break;
case 3:
 istringval ="Cost is £"+ costofmpv.toFixed(2);
 calculatedfare=costofmpv.toFixed(2);
 vehicleclass="M";
 //  img = "images/MPV.png";

break;
case 4:
  istringval = "Cost is £"+ costofjourney.toFixed(2);
  calculatedfare=costofjourney.toFixed(2);
 vehicleclass="L";
 

break;
default:{}



}

//document.getElementById('image').innerHTML="<img src="+img+">";
document.getElementById('total').innerHTML = istringval;
// document.getElementById('but').innerHTML = "<img src="+"images/but.png"+">";
 

}
function mylocation()
{
window.location.href = "map.html";
}

///////////my local place search nearby
function mylocalplace()
{
window.location.href = "place.html";
}

function favtolocalstorage()
{

//<button onclick="favtolocalstorage()">Save to Favourite</button> 
//save current gmap object in TO to local storage for favourites

//check index of fav and save accordingly

if(window.localStorage.fav)//if it exist read in
  {
     myfavy=removedupinarray(JSON.parse(window.localStorage.fav));//remove dups
   }
    myfavy.push(bookingloc[1]);//TO add it to myfavy array
    window.localStorage.setItem("fav", JSON.stringify(myfavy)); //store it
    
}
function favfromlocalstorage()
{
//   <button onclick="favfromlocalstorage()">Save to Favourite</button>
//check index of fav and save accordingly
if(window.localStorage.fav)//if it exist read in
  {
    myfavy=JSON.parse(window.localStorage.fav);
   }
    myfavy.push(bookingloc[0]);//to add it
    myfavy=removedupinarray(myfavy);//remove dups before saving
    window.localStorage.setItem("fav", JSON.stringify(myfavy)); //store it
    
}
////////////////////////////////////////////////////////////////////
///populate favourites from local storage dynamically in 'to' list
function populatefavsto()
{
//<button onclick="populatefavsto();">Get Favourite</button>
//get favourites from localStorage and populate in list
//event handling
var select = document.getElementById("GetFavouritebackto");


/////////////////////////////////////////////////////////////////
////////get favourite from localstorage , and the values are populated in the options
if(select.length>0)
{
if(window.localStorage.fav)//if it exist read in
  {
    myfavy=JSON.parse(window.localStorage.fav);
   }
///remove existing list banish it
 myfavy=removedupinarray(myfavy);//remove dups before loading
while (select.firstElementChild) {
    select.removeChild(select.firstElementChild);
}
 
//reading array values in to the list
var optionsupdate=[];
for(var id = 0; id < myfavy.length; id++) {
    optionsupdate[id]=myfavy[id].address;//the full address of each entity is first array
    var optupdate = optionsupdate[id];
    var elupdate = document.createElement("option");
    elupdate.textContent = optupdate;
    elupdate.value = optupdate;
    select.appendChild(elupdate);
}
}

///////////////////////



//////////////////////////////////////////////////////////////////


if(select.length===0){
//check if its first time then populate else go away
if(window.localStorage.fav)//if it exist read in
  {
    myfavy=JSON.parse(window.localStorage.fav);
   }
   myfavy=removedupinarray(myfavy);//remove dups before loading
var options=[];
//reading array values in to the list
for(var ie = 0; ie < myfavy.length; ie++) {
    options[ie]=myfavy[ie].address;//the full address of each entity is first array
    var opt = options[ie];
    var el = document.createElement("option");
    el.textContent = opt;
    el.value = opt;
    select.appendChild(el);
}
}


////////////////////////

//////////end of function
}

//event handler on selecting index it assigned object to bookingloc[0], and full address
function selectfavputinto()
{
// <select id="GetFavouritebackto" onClick="selectfavputinto();">
//whatever is selectedIndex
//push it in 'to' field    
//////////
var select = document.getElementById("GetFavouritebackto");
var fbto=select.selectedIndex;//it corresponds to myfavy[i][0]
bookingloc[1]=myfavy[fbto];//so corresponding full object in booking loc
document.getElementById('autocomplete1').value=bookingloc[1].address;
calcRoute();//trigger to get fare
}
////////////////////////////////////////////////////////////////////
///populate favourites from local storage dynamically in 'from' list
function populatefavsfrom()
{
//<button onclick="populatefavsfrom();">Get Favourite</button>
//event handling
var select = document.getElementById("GetFavouritebackfrom");
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
////////get favourite from localstorage , and the values are populated in the options
if(select.length>0)
{
if(window.localStorage.fav)//if it exist read in
  {
    myfavy=JSON.parse(window.localStorage.fav);
   }
///remove existing list banish it
myfavy=removedupinarray(myfavy);//remove dups before loading 
while (select.firstElementChild) {
    select.removeChild(select.firstElementChild);
}
 
//reading array values in to the list
var optionsupdate=[];
for(var ig = 0; ig < myfavy.length; ig++) {
    optionsupdate[ig]=myfavy[ig].address;//the full address of each entity is first array
    var optupdate = optionsupdate[ig];
    var elupdate = document.createElement("option");
    elupdate.textContent = optupdate;
    elupdate.value = optupdate;
    select.appendChild(elupdate);
}
}

///////////////////////






/////////////////////////////////////////////////////////////
if(select.length===0){
//check if its first time then populate else go away
if(window.localStorage.fav)//if it exist read in
  {
    myfavy=JSON.parse(window.localStorage.fav);
   }
   myfavy=removedupinarray(myfavy);//remove dups before loading 
var options=[];
//reading array values in to the list
for(var ih = 0; ih < myfavy.length; ih++) {
    options[ih]=myfavy[ih].address;//the full address of each entity is first array
    var opt = options[ih];
    var el = document.createElement("option");
    el.textContent = opt;
    el.value = opt;
    select.appendChild(el);
}
}

//////////end of function
}

//event handler on selecting index it assigned object to bookingloc[0], and full address
function selectfavputinfrom()
{
/////<select id="GetFavouritebackfrom" onClick="selectfavputinfrom();">
//whatever is selectedIndex
//push it in 'to' field    
//////////
var select = document.getElementById("GetFavouritebackfrom");
var fbto=select.selectedIndex;//it corresponds to myfavy[i][0]
bookingloc[0]=myfavy[fbto];//so corresponding full object in booking loc
document.getElementById('autocomplete').value=bookingloc[0].address;
calcRoute();//trigger to get fare
}

///////////////////////////////////////////////////////////////////
//delete favourite to / from
function delfavfromlocalstorageto()
{
//<button onclick="delfavfromlocalstorageto()">delete from Favourite</button>
var select = document.getElementById("GetFavouritebackto");
var fbto=select.selectedIndex;//it corresponds to myfavy[i][0]
// now need to delete it from drop down as well
select.remove(fbto);
///////////////////
myfavy.splice(fbto, 1);//remove one element from position fbto without leaving a hole in the favy array
//myfavy=JSON.parse(window.localStorage.fav);

window.localStorage.setItem("fav", JSON.stringify(myfavy)); //update the store 


}
function delfavfromlocalstoragefrom()
{

//<button onclick="delfavfromlocalstoragefrom()">delete from Favourite</button>;
var select = document.getElementById("GetFavouritebackfrom");
var fbto=select.selectedIndex;//it corresponds to myfavy[i][0]
// now need to delete it from drop down as well
select.remove(fbto);
///////////////////
myfavy.splice(fbto, 1);//remove one element from position fbto without leaving a hole in the favy array
//myfavy=JSON.parse(window.localStorage.fav);
window.localStorage.setItem("fav", JSON.stringify(myfavy)); //update the store 

}

///////////////////////////////////////////////////////////////////

//<select id="GetRepeatBooking" onClick="selectbookingintonfrom();">
//</select>

function bookingsavetolocalstorage()
{

//automatically save it //called from calcRoute
//save current gmap object in TO and from including via's to  to local storage for favourites

//check index of fav and save accordingly

if(window.localStorage.bookhist)//if it exist read in
  {
    myoldbookings=JSON.parse(window.localStorage.bookhist);//myoldbookings is global cache for holding bookinghist from localstorage
   }
    myoldbookings.push(bookingloc);//TO add it to myoldbookings array
    myoldbookings=removedupinarray(myoldbookings);//remove dups
    window.localStorage.setItem("bookhist", JSON.stringify(myoldbookings)); //store it
    
}


///populate favourites from local storage dynamically in 'to' list
function myRepeatBooking()
{
//<button onclick="myRepeatBooking()">Repeat Booking</button>
//get bookinghistory from localStorage and populate in list
//event handling
//var select = document.getElementById("GetRepeatBooking");


/////////////////////////////////////////////////////////////////
////////get bookhist from localstorage , and the values are populated in the options
if(select.length>0)
{
if(window.localStorage.bookhist)//if it exist read in
  {
    myoldbookings=JSON.parse(window.localStorage.bookhist);
   }
///remove existing list banish it
 myoldbookings=removedupinarray(myoldbookings);//remove dups
while (select.firstElementChild) {
    select.removeChild(select.firstElementChild);
}
 
//reading array values in to the list
var optionsupdate=[];
for(var ii = 0; ii < myoldbookings.length; ii++) {
    optionsupdate[ii]=myoldbookings[ii][0].address+"->"+myoldbookings[ii][1].address;//the full address of each entity is first array
    var optupdate = optionsupdate[ii];
    var elupdate = document.createElement("option");
    elupdate.textContent = optupdate;
    elupdate.value = optupdate;
    select.appendChild(elupdate);
}
}

///////////////////////



//////////////////////////////////////////////////////////////////


if(select.length===0){
//check if its first time then populate else go away
if(window.localStorage.bookhist)//if it exist read in
  {
    myoldbookings=JSON.parse(window.localStorage.bookhist);
   }
var options=[];
//reading array values in to the list
for(var ij = 0; ij < myoldbookings.length; ij++) {
    options[ij]=myoldbookings[ij][0].address+"->"+myoldbookings[ij][1].address;//the full address of each entity is first array
    var opt = options[ij];
    var el = document.createElement("option");
    el.textContent = opt;
    el.value = opt;
    select.appendChild(el);
}
}


////////////////////////

//////////end of function
}

//event handler on selecting index it assigned object to bookingloc[0], and full address
function selectbookingintonfrom()
{
// <select id="GetRepeatBooking" onClick="selectbookingintonfrom();">
//whatever is selectedIndex
//push it in 'to' and from  field    
//////////
//var select = document.getElementById("GetRepeatBooking");
var fbto=select.selectedIndex;//it corresponds to myoldbookings[i]
bookingloc=myoldbookings[fbto];//so corresponding full object in booking loc
document.getElementById('autocomplete').value=bookingloc[0].address;
document.getElementById('autocomplete1').value=bookingloc[1].address;
////////////////sorting out via if any//////////////////////////

/////////function to remove all via if any
if(numofvia){ //if nonzero via remove em else chill
for (var ia=0; ia<numofvia ;ia++){
removeElement();
}
}
var numofviaregen=(bookingloc.length)-2;//set numofvia required for booking history
///////add new vias
if(numofviaregen)
{//is there any via in the history
//////////populate them from booking loc;
///
for (var ib=0; ib<numofviaregen ;ib++){
addElement();
var j=ib+2;//as first 2 entries are FROM n TO in bookingloc
var meid="autocomplete"+j;
document.getElementById(meid).value=bookingloc[j].address;
}
}
//call calcRoute() so that fare gets updated
calcRoute();
}///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////
//////////////exit wound the size of a tangerine
function cleanup()
{
var activebooking={};//current active booking
  //bookingloc; contains geography, calculatedfare; contains fare
//get current date and time for ASAP jobs
// put a check box for asap jobs and checks it put current date and time for it
//var successful will be used for validation at each step
//telcust=document.getElementById("telme").value;
//emailmevar=document.getElementById("emailme").value;
if(telcust==""){alert("please put your contact and press 'Confirm' again");return;}//break off function
 var telvalid=telcust.replace(/\W+/g, '');//remove non numeric anything from the phone
if(telvalid.length<7){alert("Please Enter Telephone Number it's missing some digits and press 'Confirm' again");return;}
if(!(/\S+@\S+\.\S+/.test(emailmevar))){alert("Please Enter a Valid Email address and press 'Confirm' again");return;}//one time valid email check some@body.com
if(calculatedfare==0){alert("please calculate fare");return;}//break off
//if(vehicleclass==0){alert("please select vehicle type");return;}//break off //not needed anymore
//if(emailmevar==""){alert("please put your email");return;}//break off function
//email is optional but tel is mandatory
/////////////////FOR ASAP JOBS/////////////////////  
var asapjob;//is it asap job
var currentdatetime= new Date().toISOString();//gives current date and time as ISO string
var currentdatetimeparse= Date.parse(currentdatetime);//to be used in calculation for asap jobs the integers value
asapjob=document.getElementById("myCheck").checked;
if (asapjob)
  {
  //save bookingloc; save date n time , 
  //flag it as active job in local storage
  //////////////////////////////////////////
    /////////////////////////////////////////
  activebooking["datentime"]=currentdatetimeparse;
  var timearr=currentdatetime.split("T");//split in to date and time
  var timemill=timearr[1].split(".");//get rid of milliseconds
  activebooking["date"]=timearr[0];
  activebooking["time"]=timemill[0];
   /////////////////////////////////////////

  }
  
  
  /////////////////////////////////////////

//////////if asap jobs skip this//////////////
else
  {  
//////////////////FOR FUTURE BOOKINGS/////////////////////////////
var usertime=document.getElementById("metime").value;
if (usertime==""){alert("please set time");return;}////////////////////time not set
var userdate=document.getElementById("medate").value;
if (userdate==""){alert("please set date");return;}////////////////////date not set
var combinedatentime=userdate+" "+usertime;
var futureisodnt=new Date(combinedatentime).toISOString();//future booking date n time as ISO string
var futureisodntparse=Date.parse(futureisodnt);//future booking date n time as ISO integers
//data validation must not be in past
if (bookingloc[0]==bookingloc[1]){alert("origin cannot be same as destination");}
///test code start
var vmedate=Date.parse(combinedatentime);//date parse will parse the string and gives the hash
var vnowdate=Date.parse(Date());//get Current Date
var datediff=vmedate-vnowdate;//this should be positive
if (datediff<0) {alert("past date n time bookings not allowed");return;}//break
  ////
  
  activebooking["datentime"]=futureisodntparse;
  var ftimearr=futureisodnt.split("T");//split in to date and time
  var ftimemill=ftimearr[1].split(".");//get rid of milliseconds
  activebooking["date"]=ftimearr[0];
  activebooking["time"]=ftimemill[0];
 
  }

activebooking["tel"]=telvalid;
activebooking["email"]=emailmevar;
window.localStorage.setItem("email", JSON.stringify(emailmevar)); //store it
window.localStorage.setItem("tel", JSON.stringify(telcust)); //store it
activebooking["fromtovia"]=bookingloc;
activebooking["fare"]=calculatedfare;//date ,time ,tel, bookingloc,fare,
activebooking["vehicletype"]=vehicleclass;//vehicle type 0 SALOON 1 ESTATE 2 EXECUTIVE 3 MPV
jobref=referencegen(6, '0123456789');//human friendly 6 digit ref for customer
activebooking["jobref"]=jobref;
activebooking["jobmileage"]=jobmileage;
activebooking["drvnote"]=drvnote;

//activebooking = datentime,tel,email,bookingloc,fare,vehicletype

///query server for booking id
//send date for job table
//if (successful, function should return booking ref)
////////
//connect to remote database 
//get primary id key for jobs

//if unsuccessful alert than break

//save it in bookingid;
////////////
//activebooking.push(bookingid); CODE
///save it to localstorage
//

//WARNING I HAVENT ADDED ANY (booking ref)ID YET BEFORE SAVING TO LOCALSTORAGE
if(window.localStorage.activebookingls)//if it exist read in
  {
activebookinghist=JSON.parse(window.localStorage.activebookingls);
//activebookinghistory  is global cache for holding activebookingls from localst
   }
    activebookinghist.push(activebooking);//TO add it to acitvebookinghist array
    window.localStorage.setItem("activebookingls", JSON.stringify(activebookinghist)); //store it
////////////////    
//activebooking;
//[1403109126000, "07947771751", "i@i.com",Array[2], "5.00", 1]

//////////
///////test code start
    //save curractivebooking in local storage by jsonifing the object
    window.localStorage.setItem("curactivebooking", JSON.stringify(activebooking)); //store it
    
   createdf();
/////////////test code end

}

function asaphidemanual()
{
if (document.getElementById("myCheck").checked)
  
  {
    //hide the manual date and time input
    document.getElementById("medate").style.display='none';
    document.getElementById("metime").style.display='none';
  }
 else
 {
  //show the manual date and time input
    document.getElementById("medate").style.display='';
    document.getElementById("metime").style.display='';
   
}
   
 
}
//////////////////////////////////////////////////
function initasaphidecalnclock()
{
  document.getElementById("myCheck").checked=true;
  //hide the manual date and time input
  document.getElementById("medate").style.display='none';
  document.getElementById("metime").style.display='none';
}
//////////////////////////////////////////////////
function myreturnfn()
{
  //id="myreturn" onchange="myreturnfn()
  if (document.getElementById("myreturn").checked)
  
  {
    //swap origin and destination
    bookingloc.reverse();//reverse array;
    //populating bookingloc in document.elements
    //redrawing via's as well
    document.getElementById('autocomplete').value=bookingloc[0].address;
document.getElementById('autocomplete1').value=bookingloc[1].address;
////////////////sorting out via if any//////////////////////////

/////////function to remove all via if any
if(numofvia){ //if nonzero via remove em else chill
for (var ia=0; ia<numofvia ;ia++){
removeElement();
}
}
var numofviaregen=(bookingloc.length)-2;//set numofvia required for booking history
///////add new vias
if(numofviaregen)
{//is there any via in the history
//////////populate them from booking loc;
///
for (var ib=0; ib<numofviaregen ;ib++){
addElement();
var j=ib+2;//as first 2 entries are FROM n TO in bookingloc
var meid="autocomplete"+j;
document.getElementById(meid).value=bookingloc[j].address;
}
}
    
    //////end of population logic
  }
}


/////////////////////////////////
///////unique booking history and favourites no duplicates
//Hash Sieving
//http://www.shamasis.net/2009/09/fast-algorithm-to-find-unique-items-in-javascript-array/
function removedupinarray(iarr)
{
  var o = {}, i, l = iarr.length, r = [];
    for(i=0; i<l;i+=1) o[iarr[i].address] = iarr[i];
    for(i in o) r.push(o[i]);
    return r;
  }

/////////////////////////////////
//if no favourite then disable get and delete favourite
//function nofavy()
//{
//  //   <button onclick="populatefavsfrom();" id="gff">Get Favourite</button>
//  //<select id="GetFavouritebackfrom" onClick="selectfavputinfrom();">
// //   <button onclick="delfavfromlocalstoragefrom()" id="dff">delete from Favourite</button>
// //     <button onclick="populatefavsto();" id=gft>Get Favourite</button>
// //            <select id="GetFavouritebackto" onClick="selectfavputinto();">
// //            <button onclick="delfavfromlocalstorageto()" id="dft">delete from Favourite</button>
//  if(typeof window.localStorage.fav=='undefined')
//  {
//   document.getElementById("gff").style.display='none';
//   document.getElementById("GetFavouritebackfrom").style.display='none';
//   document.getElementById("dff").style.display='none';
//   document.getElementById("gft").style.display='none';
//   document.getElementById("GetFavouritebackto").style.display='none';
//   document.getElementById("dft").style.display='none';
//   return;
//  }
//  if(window.localStorage.fav.length==0)
//  {
//    
//   document.getElementById("gff").style.display='none';
//   document.getElementById("GetFavouritebackfrom").style.display='none';
//   document.getElementById("dff").style.display='none';
//   document.getElementById("gft").style.display='none';
//   document.getElementById("GetFavouritebackto").style.display='none';
//   document.getElementById("dft").style.display='none';
//    
//  } 
//  else
//  {
//   document.getElementById("gff").style.display='';
//   document.getElementById("GetFavouritebackfrom").style.display='';
//   document.getElementById("dff").style.display='';
//   document.getElementById("gft").style.display='';
//   document.getElementById("GetFavouritebackto").style.display='';
//   document.getElementById("dft").style.display='';
//  }
//}
//////////////////////////////////////////
function nomyoldbookings()
{
 if(typeof window.localStorage.bookhist=='undefined')
 {
   //  <button id="repeatbk" onclick="myRepeatBooking()">Repeat Booking</button>
    //<select id="GetRepeatBooking" onClick="selectbookingintonfrom();">
    //document.getElementById("repeatbk").style.display='none';
    //document.getElementById("GetRepeatBooking").style.display='none';
    return;
  } 
  if(window.localStorage.bookhist.length==0)
  {
    //  <button id="repeatbk" onclick="myRepeatBooking()">Repeat Booking</button>
    //<select id="GetRepeatBooking" onClick="selectbookingintonfrom();">
   // document.getElementById("repeatbk").style.display='none';
   // document.getElementById("GetRepeatBooking").style.display='none';
    
  } 
  else
  {
  
    //document.getElementById("repeatbk").style.display='';
    //document.getElementById("GetRepeatBooking").style.display='';
    
  }
 
}
//////////////////////////////////////////
//function to go to the sdk generated index of dream factory



///////////////////////////////////////////////////////////////////////////////////
//function lsset(keyname,keyval){
  
//window.localStorage.setItem(keyname, JSON.stringify(keyval));
//}
  
//keyval= JSON.parse(window.localStorage.keyname);
//iky= {name:"imran",age:30};
//{address:,postcode:,lat:,lon:};

function referencegen(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}
//var rString = referencegen(6, '0123456789abcdefghjkmnpqrstuvwxyz');

function showvia()
{
document.getElementById("remove11").style.display="block";
}
function nonevia()
{
document.getElementById("viazz").style.display="block";
}

function sanitychk()
{
   //check if user has blanked the field
  
  if(document.getElementById('autocomplete').value===""){
    document.getElementById("viazz").style.display="none";
	alert("Please input 'From'");
    document.getElementById('total').innerHTML="";
    return;
    
  }
  else{
	  document.getElementById("viazz").style.display="block";
  }
//  if(document.getElementById('autocomplete1').value===""){
//    document.getElementById("viazz").style.display="none";
//	alert("Please input 'To'");
//    document.getElementById('total').innerHTML="";
//    return;
//    
//  }
//   else{
//	  document.getElementById("viazz").style.display="block";
//  }
    ///check end
} 

function noteme()
{
drvnote=prompt("Please Enter Driver's Note");	
}