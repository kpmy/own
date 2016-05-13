function Test(rts){
};
module.exports=function(rts){console.log('dynamic load'); return new Test(rts)};