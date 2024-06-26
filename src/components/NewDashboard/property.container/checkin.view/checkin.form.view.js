import React, {useState, useEffect} from 'react';
import {checkInFormValue, prebookExcludeDates} from "../../../utils/checkin.form.utils";
import brewDate from 'brew-date';
import MetadataFields from '../../../fields/metadata.fields.view';
import CustomModal from "../../../fields/customModalField/custom.modal.view";
import { activityLoader } from '../../../common.functions/common.functions.view';
import {getStayedDays, determineGSTPercent, getTimeDate, formatDate} from '../../../common.functions/common.functions';
import {
  nodeConvertor,
  validateFieldData,
  updateMetadataFields,
  getCurrentUser, checkIfFieldsAreUpdated
} from '../../../common.functions/node.convertor';
import { getStorage } from '../../../../Controller/Storage/Storage';
import propertyContainerConstants from "../property.container.constants";

const CheckinForm = (props) => {
  
  // Advance restricted!
  function _isAdvanceRestricted(){
    return JSON.parse(getStorage('isAdvanceRestricted'));
  };
  
  // Property container state handler!
  const [propertyContainer, setPropertyContainer] = useState({
    isLoading: false,
    customModal: false,
    isStateRouterNotified: false
  });

  // Custom modal state handler!
  const [customModalState, setCustomModalState] = useState({
    show: false,
    onHide: onCloseCustomModal,
    header: 'New guest has been checked-in.',
    centered: false,
    restrictBody: true,
    modalSize: "medium",
    footerEnabled: false,
    customData: undefined
  });

  // Checkin form fields state handler!
  const [checkinFields, setCheckinFields] = useState([
    {
      value: undefined,
      restrictShow: checkCustomizableFields('updatePrice'),
      width: '500px',
      placeholder: "Update Room Price",
      label: "Update Room Price",
      name: 'updatePrice',
      attribute: 'textField',
      isRequired: false
    },
    {
      value: new Date(),
      placeholder: "Checkin Date",
      label: "Date of Check-In",
      name: 'checkin',
      attribute: 'dateField',
      dateFormat: 'MMMM d, yyyy',
      isRequired: true,
      inlineToast: {
        isShow: false,
        inlineMessage: 'Please provide a valid input.'
      },
      style: {
        width: '500px'
      }
    },
    {
      value: new Date(),
      defaultValue: new Date(),
      excludeDates: [],
      placeholder: "Checkout Date",
      label: "Date of Check-Out",
      name: 'checkout',
      dateFormat: 'MMMM d, yyyy',
      attribute: 'dateField',
      isRequired: true,
      inlineToast: {
        isShow: false,
        inlineMessage: 'Please provide a valid input.'
      },
      style: {
        width: '500px'
      },
      callBackAfterUpdate: _restrictAdvAndDiscount
    },
    {
      value: props.data?.userModel?.username,
      width: '500px',
      placeholder: "Customer Name",
      label: "Customer Name",
      name: 'customername',
      attribute: 'textField',
      isRequired: true,
      inlineToast: {
        isShow: false,
        inlineMessage: 'Please provide a valid input.'
      }
    },
    {
      value: props.data?.userModel?.phonenumber,
      width: '500px',
      placeholder: "Phone Number",
      label: "Phone Number",
      name: 'phonenumber',
      attribute: 'textField',
      isRequired: true,
      inlineToast: {
        isShow: false,
        inlineMessage: 'Please provide a valid input.'
      }
    },
    {
      value: props.data?.userModel?.aadharcard,
      width: '500px',
      placeholder: "Aadhar Number",
      label: "Aadhar Number",
      name: 'aadhar',
      attribute: 'textField',
      isRequired: true,
      inlineToast: {
        isShow: false,
        inlineMessage: 'Please provide a valid input.'
      }
    },
    {
      value: props.data?.userModel?.address,
      width: '500px',
      placeholder: "Address",
      label: "Address",
      name: 'address',
      attribute: 'textField',
      isRequired: true,
      inlineToast: {
        isShow: false,
        inlineMessage: 'Please provide a valid input.'
      }
    }
  ]);
  
  // Customizable fields state handler!
  const [customizableFields, setCustomizableFields] = useState([
    {
      value: 'Walk-In',
      defaultValue: 'Walk-In',
      restrictShow: checkCustomizableFields('isChannel'),
      width: '500px',
      placeholder: "Choose the preferred channel manager",
      label: "Channel Manager",
      name: 'channel',
      attribute: 'listField',
      isRequired: false,
      dependentValue: ['advance', 'discount'],
      dependentValueUpdateWithNoCondition: false,
      options: [
        {
          value: "Make My Trip"
        },
        {
          value: "Oyo"
        },
        {
          value: 'Walk-In'
        }
      ],
      style: {
        color: "black",
        fontSize: "15px",
        paddingRight: "10px",
        paddingLeft: "10px",
        cursor: "pointer",
      }
    },
    {
      value: undefined,
      defaultValue: 0,
      width: '500px',
      placeholder: 'Extra Beds Count',
      label: 'Extra Beds',
      name: 'extraBeds',
      validation: false,
      validationRegex: /^(0|[1-9]\d*)$/,
      attribute: 'textField',
      isRequired: false,
      inlineToast: {
        isShow: false,
        inlineMessage: 'Please provide a valid input!'
      }
    },
    {
      value: undefined,
      defaultValue: 0,
      width: '500px',
      placeholder: _isAdvanceRestricted() ? 'Advance Amount' : 'Cash and Deposit',
      label: _isAdvanceRestricted() ? 'Advance Amount' : 'Cash and Deposit',
      name: 'advance',
      validation: _isAdvanceRestricted(),
      validationRegex: /^(0|[1-9]\d*)$/,
      condition: undefined,
      attribute: 'textField',
      restrictShow: false,
      isRequired: false,
      fieldShouldVanish: true,
      updateIsRequiredOnDependentValue: true,
      inlineToast: {
        isShow: false,
        inlineMessage: 'Please provide a valid input!'
      }
    },
    {
      value: undefined,
      width: '500px',
      defaultValue: 0,
      placeholder: "Discount Amount",
      label: "Discount Amount",
      name: 'discount',
      validation: true,
      validationRegex: /^(0|[1-9]\d*)$/,
      condition: undefined,
      attribute: 'textField',
      restrictShow: false,
      isRequired: false,
      fieldShouldVanish: true,
      updateIsRequiredOnDependentValue: true,
      inlineToast: {
        isShow: false,
        inlineMessage: 'Please provide a valid input!'
      }
    },
    {
      value: undefined,
      width: '500px',
      placeholder: "Adults",
      label: "Adults Count",
      name: 'adults',
      validation: true,
      validationRegex: /^(0*[1-9][0-9]*(?:\.\d+)?|0+\.\d*[1-9][0-9]*)$/,
      attribute: 'textField',
      isRequired: true,
      inlineToast: {
        isShow: false,
        inlineMessage: 'Please provide a valid input.'
      }
    },
    {
      value: undefined,
      width: '500px',
      defaultValue: '0',
      placeholder: "Childrens",
      label: "Childrens Count",
      name: 'childrens',
      attribute: 'textField',
      isRequired: false
    }
  ]);

  // Get price amount for advance amount restriction!
  function getPriceAmount(){
    var priceAmount;
    var result = checkIfFieldsAreUpdated(checkinFields, 'updatePrice');
    if(result.isFieldUpdated){
      priceAmount = result.updatedValue;
    } else {
      priceAmount = props.data.roomModel.price;
    };
    return priceAmount;
  };
  
  // Restrict advance and discount controller!
  function _restrictAdvAndDiscount(){ // If any of these two restricted coming via config use that condition here!
    var priceAmount = getPriceAmount(),
      currentDate = brewDate.getFullDate("yyyy/mm/dd"),
      dateOfCheckout = checkIfFieldsAreUpdated(checkinFields, 'checkout').updatedValue,
      stayedDays = getStayedDays(currentDate, dateOfCheckout),
      gstPrice = props.data.roomModel.price * determineGSTPercent(props.data.roomModel.price),
      totalAmount = (stayedDays * priceAmount) + (stayedDays * gstPrice);
    // If cash and deposit were configured, Don't restrict or limit the entry for C&D.
    _isAdvanceRestricted() && _restrictAdvanceAmount(totalAmount);
    _restrictDiscountAmount(totalAmount); 
  }; 
  
  // Get advance amount limit!
  function _restrictAdvanceAmount(totalAmount){
    var nodeValue = {isShow: true, inlineMessage: `Advance amount cannot be greater than ${totalAmount}`};
    updateMetadataFields('advance', nodeValue, customizableFields, setCustomizableFields).then(() => {
      updateMetadataFields('advance', {condition: {validationStatement: '>=', validationValue: totalAmount}}, customizableFields, setCustomizableFields);
    });
  };

  // Get discount amount limit!
  function _restrictDiscountAmount(totalAmount){
    var restrictedDiscount = totalAmount * (3 / 4);
    var nodeValue = {isShow: true, inlineMessage: `Discount amount cannot be greater than ${restrictedDiscount}`};
    updateMetadataFields('discount', nodeValue, customizableFields, setCustomizableFields).then(() => {
      updateMetadataFields('discount', {condition: {validationStatement: '>=', validationValue: restrictedDiscount}}, customizableFields, setCustomizableFields);
    });
  };
  
  // Check customizable fields!
  function checkCustomizableFields(field){
    return !JSON.parse(getStorage(field));
  }
    
  // Get field events!
  function getFieldData(value){
    return nodeConvertor(value);
  };
  
  // Toggle property container loader!
  function _toggleLoader(value){
    setPropertyContainer(prevState => ({...prevState, isLoading: value}));
  };
  
  // trigger custom modal!valueFromCustomModal
  function _triggerCustomModal(value, customData){
    setPropertyContainer(prevState => ({...prevState, customModal: value}));
    setCustomModalState(prevState => ({...prevState, show: value, customData: customData}));
  }

  // Notify the state router of the checkin perspective loaded.
  function _notifyStateRouter(){
    var opts = {
      routerOptions: {
        currentRouter: 'property-container',
        action: 'ADD',
        currentTableMode: 'afterCleaned',
        currentDashboardMode: propertyContainerConstants.DASHBOARD_MODE.edit
      }
    };
    props.routerController()._notifyStateRouter(opts);
    setPropertyContainer(prevState => ({...prevState, isStateRouterNotified: true}));
  };
  
  // Checkin form view!
  function _checkinFormView(){
    !propertyContainer.isStateRouterNotified && _notifyStateRouter();
    if(propertyContainer.isLoading){
      var opts = {
        color: "black",
        marginTop: (props.height / 2.5) + "px",
        textCenter: true
      }
      return activityLoader(opts);
    } else {
      return(
        <>
          <div className = 'dashboard-container-fields-header'>
            Check-In Form
          </div>
          <div className = 'row'>
            <div className = 'col'>
              <MetadataFields data = {checkinFields} updateData = {setCheckinFields} />
            </div>
            <div className = 'col'>
              <MetadataFields data = {customizableFields} updateData = {setCustomizableFields} />
            </div>
          </div>
        </>
      )
    }
  };
  
  // Render custom modal!
  function _renderCustomModal(){
    return <CustomModal modalData = {customModalState} />
  };

  // On form save event!
  async function onFormSave(){
    _toggleLoader(true);
    const isFormValid = await validateFieldData(checkinFields, setCheckinFields);
    const isCustomizableFieldValid = await validateFieldData(customizableFields, setCustomizableFields);
    if(isFormValid.length === 0 && isCustomizableFieldValid.length === 0){
      const formValue = getFieldData(checkinFields); // Default input fields!
      const customizableFormValues = getFieldData(customizableFields); // Customizable form values!
      customizableFormValues['isChannel'] = (customizableFormValues.channel !== 'Walk-In'); // This params is needed when dealing with channel manager!
      // Delete advance and discount from the fieldValue if the channel manager is true!
      customizableFormValues.isChannel && delete customizableFormValues.advance && delete customizableFormValues.discount;
      const finalFormValue = Object.assign(formValue, customizableFormValues); // Final form value ready to be sent to the server!
      updateDefaultFormValue(formValue); // This will change the formValue directly.
      const serverResult = await checkInFormValue(finalFormValue);
      if(serverResult.data.success){
        _triggerCustomModal(true, {updatedRoomModel: serverResult.data.updatedModel, updatedUserModel: serverResult.data.updatedUserModel, isSuccessToast: true});
        _toggleLoader(false);
      };
    };
  };

  // Update the form value with default values!
  function updateDefaultFormValue(formValue){
    var timeDate = getTimeDate();
    formValue.checkin = brewDate.getFullDate("yyyy/mm/dd");
    formValue.checkout = formatDate(formValue.checkout);
    formValue['checkinTime'] = timeDate.getTime;
    formValue['checkoutTime'] = formValue.checkout !== undefined ? timeDate.getTime : undefined;
    formValue['isPrebook'] = false;
    formValue['dateTime'] = brewDate.getFullDate("dd/mmm") +  " " + brewDate.timeFormat(brewDate.getTime());
    formValue['roomid'] = props.data.roomModel._id;
    formValue['roomno'] = props.data.roomModel.roomno;
    formValue['floorNo'] = props.data.roomModel.floorNo;
    formValue['lodgeId'] = props?.params?.accIdAndName[0];
    formValue['checkinBy'] = getCurrentUser();
    return formValue;
  };
  
  // After form has been saved!
  function onCloseCustomModal(valueFromCustomModal){
    _triggerCustomModal(false);
    _updateDashboardPropertyContainer(valueFromCustomModal);
    if(valueFromCustomModal.isSuccessToast){
      props.routerController()._notifyStateRouter({routerOptions: {action: 'DELETE'}}).then((result) => {
        props.dashboardController(props.routerOptions(result));
      })
    };
  };
  
  // Update dashboard property container!
  function _updateDashboardPropertyContainer(customData){
    props.afterFormSave({reloadSidepanel: {silent: true}, persistStatusView: false, widgetTileModel: {objectIdToBeUpdated: customData.updatedRoomModel._id,
        selectedConstant: [props.data.userStatusMap[props.data.roomModel.roomStatusConstant]], action: 'REMOVE', keysToCompare: ['_id']},
      updatedModel: customData.updatedRoomModel, updateUserCollection: {updatedUserModel: customData.updatedUserModel, action: 'CHECK-IN'}})
  };
  
  // Get exclude dates and append it on date of checkout!
  async function _getExcludeDates(){
    _toggleLoader(true);
    var excludeDates = [];
    var result = await prebookExcludeDates({roomModelId: props.data.roomModel._id});
    if(result.success){
        result.message.map((options) => {
          excludeDates.push(new Date(options));
        })
    };
    _toggleLoader(false);
    var nodeValue = {excludeDates: excludeDates};
    updateMetadataFields('checkout', nodeValue, checkinFields, setCheckinFields);
  };
  
  // Listeners!
  useEffect(() => {
    _getExcludeDates();
    props.data.onFormSave && onFormSave(); // this method will get triggered by property container!
  }, [props.data])
  
  return(
    <div className = "dashboard-container-fields-view" style = {{height: props.height - 1}}>
      {_checkinFormView()}
      {propertyContainer.customModal && _renderCustomModal()}
    </div>
  )
}

export default CheckinForm;