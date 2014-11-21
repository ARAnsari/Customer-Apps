window.app = {};
document.addEventListener("apiReady", function(){
    document.getElementById("post-results").innerHTML = "Connection to Server Established";createdf();
     

//after which, you could make a call to the db service, if the current user has access
//if you've enabled a guest user, you can give them access to any resource without auth.

    
    window.app.getErrorString = function(response){
        var msg = "An error occurred, but the server provided no additional information.";
        if (response.content && response.content.data && response.content.data.error) {
            msg = response.content.data.error[0].message;
        }
        msg = msg.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&apos;/g, '\'');
        return msg;
    };
}, false);


function createdf()
{
  
////////////////    
//activebooking;
//[1403109126000, "07947771751", "i@i.com",Array[2], "5.00", 1]

//////////
//creating record
var item1 = JSON.parse(window.localStorage.curactivebooking);//converting it back to array of objects 
var item={ "record":[item1]};
//var item = {"record":[{"name":"New Item","complete":false}]};
        window.df.apis.localmongo.createRecords({"table_name":"scarscollection", "body":item}, function(response) {
            document.getElementById("post-results").innerHTML = "Your booking reference is"+JSON.stringify(response.record[0]._id);
             });

             }

//reference is returned in response.record[0]._id
/////////////////////////////////
//getting is working
//window.df.apis.localmongo.getRecords({table_name: "scarscollection"}, function (response) {
 //         //Do something with the data;
 //           console.log(response);
 //       });
//
//
//remember that database accepts OBJECTS not JSONIFIED STRING
//response for creating records is record id;
///////////////////////////////////////////////////////////
//if human readable index is required then we can do 
//getrecords and increase it and append it as a value 









////////////////////////////////////////////////////////////