import CollectionInstance from '../../../../global.collection/widgettile.collection/widgettile.collection';
const axios = require('axios');
const brewDate = require('brew-date');
const Variables = require("../../../Variables");
const _ = require('lodash');

// Function to check if we need to add the usermodel to the collection instance!
function shouldAddToCollections(data, action){
  var date = action !== 'check-in' ? data.prebookdateofcheckin : data.checkout,
    updatedDateWithUserPref = brewDate.addDates(date, 3);
  return new Date(updatedDateWithUserPref) > new Date(date);
};

// Add the models to the collections!
function addToCollections(modelName, updatedModel){
  var widgetCollection = CollectionInstance.getCollections('widgetTileCollections'),
    models = widgetCollection?.data?.[modelName]
  if(models && addToCollections){
    models.push(updatedModel); // Get the updatedUserModel from the server and then update the upcomingCheckout collection model.
    CollectionInstance.setCollections('widgetTileCollections', models, modelName);
  };
};

// remove model from collections
function removeModelsFromCollections(modelName, data){
  var collections = CollectionInstance.getCollections('widgetTileCollections');
  var prebookUserModel = _.find(collections?.data[modelName], function(obj){ // When the user refreshes the page, the collectionInstance data will be lost.
    // So added a null check to prevent the code from breaking.
    return obj._id === data.userId;
  });
  if(prebookUserModel){
    CollectionInstance.removeCollections('widgetTileCollections', prebookUserModel, modelName);
  };
};

// Checkin form values!
export async function checkInFormValue(data){
  // Check if the checkin customer details has to be added in the upcomingCheckout widget collection!
  var addCollections = shouldAddToCollections(data, 'check-in');
  var result = await axios.post(`${Variables.Variables.hostId}/${data.lodgeId}/adduserrooms`, data);
  // After the data has been synced with the server, Add the user collection to the global.collections!
  addCollections && addToCollections('upcomingCheckout', result.data.updatedUserModel);
  // If the checkin is happening from prebook side, delete the upcoming prebook collection.
  data.prebook && removeModelsFromCollections('upcomingPrebook', data);
  return result;
};

// Prebook form values!
export async function prebookFormValue(data){
  // Check if the prebook customer details has to be added in the upcomingCheckout widget collection!
  var addCollections = shouldAddToCollections(data, 'pre-book');
  const result = await axios.post(`${Variables.Variables.hostId}/${data.lodgeId}/addprebookuserrooms`, data);
  // After the data has been synced with the server, Add the user collection to the global.collections!
  addCollections && addToCollections('upcomingPrebook', result.data.updatedUserModel);
  return result;
};
