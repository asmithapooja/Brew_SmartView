import './filter.table.wrapper.css';
import _ from 'lodash';
import brewDate from 'brew-date';
import TableView from '../table.view/table.view';
import {
  editPropertiesBodyView,
  favoritesCheckInFormView,
  filterTableActionCellView,
  filterTableCheckInActionCellView
} from './filter.table.wrapper.template';
import filterTableConstants from './filter.table.wrapper.constants';
import filterTableWrapperConstants from './filter.table.wrapper.constants';
import {
  filterKeysInObj,
  getCurrentUser,
  nodeConvertor,
  updateMultipleMetadataFields,
  validateFieldData
} from '../../../common.functions/node.convertor';
import {getIsExclusive, getTimeDate} from '../../../common.functions/common.functions';
import CheckoutUtils from "../../../utils/checkout.form.utils";
import {checkInFormValue} from "../../../utils/checkin.form.utils";
import CollectionInstance from '../../../../global.collection/widgettile.collection/widgettile.collection';
import CommandsGoBack from "../../commands/commands.initialize/commands.go.back";

class FilterTable extends TableView {
  
  constructor(props){
    super(props);
    this.filteredModel = {};
    this.state = {
      data: props.data,
      metadataTableState: {
        cellValues: undefined,
        headerValue: undefined,
        infoMessage: filterTableConstants.tableInfoMessage.ZERO_FILTER_MESSAGE,
        tableLoader: false,
        selectedRoomId: undefined,
        isCheckboxSelected: false,
        enableCheckbox: false,
        checkbox: [
          {
            select: (value, checkBoxIndex) => this._updateCheckboxSelection(value, checkBoxIndex),
            value: false,
            attribute: "checkBoxField",
            enableCellCheckbox: true,
            enableHeaderCheckbox: true,
            selectedCheckboxIndex: []
          }
        ],
        tableCellWidth : "590px",
        showPanelField: false
      },
      facets: {
        isFacetsEnabled: false,
        facetsHeight: undefined
      },
      customModal: {
        show: false,
        onHide: this.onCloseCustomModal.bind(this),
        header: undefined,
        centered: true,
        restrictBody: true,
        modalSize: "medium",
        footerEnabled: false,
        footerButtons: undefined
      },
      editPropertiesFields: [{
        value: undefined,
        placeholder: '',
        label: "Update Room Price",
        name: 'updatePrice',
        attribute: 'textField',
        restrictShow: false,
        isRequired: false
      }, {
        value: undefined,
        defaultValue: 0,
        placeholder: '',
        label: 'Extra Beds',
        name: 'extraBeds',
        validation: false,
        validationRegex: /^(0|[1-9]\d*)$/,
        attribute: 'textField',
        restrictShow: false,
        isRequired: false
      }, {
        select: null,
        value: undefined,
        name: 'timePeriod',
        attribute: 'checkBoxField',
        updateValue: true,
        restrictShow: true,
        label: 'Choose time period by hours for old room (Default: Days)',
        isLabelFirst: true,
        customStyle: {
          color: 'black',
          border: '1px solid grey',
          backgroundColor: '#EDEADE',
          padding: '5px 5px 5px 5px',
          borderRadius: '5px',
          marginTop: '15px'
        }
      }]
    };
    /*
     * @type {*|string}
     * This flag extraColumnState added to handle the dynamic header and action cell creation and its functionality.
     */
    this.extraColumnState = this.state.data?.filterTableOptions?.extraColumnState !== undefined ?
        this.state.data?.filterTableOptions?.extraColumnState : filterTableWrapperConstants.columnState.FILTER_COLUMN_STATE;
    this.shouldRender = true; // This flag is used re-render the table data state only when the filtered data is changes.
    /**
      Ideally, for the first time when the table state is being updated re-render lifecycle method will get triggered.
      So, again the computation happens, then the table state is being updated re-render lifecycle method will get triggered again 
      which gets the application to unresponsive state.
      and that's why added this flag to prevent that.
    **/
    this.tablePerspectiveConstant = filterTableConstants.filterTablePerspectiveConstant;
    this.params = props.params;
    this.filterActionTableHeaderValue = 'Actions';
    this.checkoutUtils = new CheckoutUtils({accId: props.params?.accIdAndName[0]});
  };
  
  // Set up the events for filter table events!
  _setUpFilterTableEvents(){
    this.events = {
      transferEvent: this.promptTransferDialog.bind(this),
      checkInEvent: this.promptCheckInDialog.bind(this)
    };
  };

  // Get transfer modal information!
  getTransferModalInfo(){
    var transferHeader = filterTableConstants.promptTransferDialog.header({currentRoom: this.roomDetails.currentRoom, nextRoom: this.roomDetails.nextRoom});
    return {
      header: transferHeader,
      restrictBody: !this.autoDecideStayTimePeriod,
      showBodyItemView: () => this._editPropertiesCustomModalBodyView(this),
      footerEnabled: true,
      footerButtons: [{
        btnId: filterTableConstants.promptTransferDialog.footerButtons.cancelBtn,
        variant: 'secondary',
        onClick: this.onCloseCustomModal.bind(this)
      }, {
        btnId: filterTableConstants.promptTransferDialog.footerButtons.transferBtn,
        variant: 'success',
        onClick: this._updateProperties.bind(this)
      }]
    };
  };

  // Get mandatory info missing modal.
  getMandatoryFieldsMissingModalInfo(){
    return {
      header: filterTableConstants.mandatoryFieldMissingDialog.header,
      restrictBody: false,
      showBodyItemView: function(){
        return 'Please verify if the date of checkout is provided.'
      },
      footerEnabled: true,
      footerButtons: [{
        btnId: filterTableConstants.mandatoryFieldMissingDialog.footerButtons.confirmBtn,
        variant: 'success',
        onClick: this.onCloseCustomModal.bind(this)
      }]
    };
  };

  // Get favorites checkin dialog modal information.
  getCheckInModalInfo(){
    return {
      header: filterTableConstants.promptCheckInDialog.header,
      restrictBody: false,
      modalSize: 'xl',
      showBodyItemView: () => this._checkInFormView(this),
      footerEnabled: true,
      footerButtons: [{
        btnId: filterTableConstants.promptCheckInDialog.footerButtons.cancelBtn,
        variant: 'secondary',
        onClick: this.onCloseCustomModal.bind(this)
      }, {
        btnId: filterTableConstants.promptCheckInDialog.footerButtons.transferBtn,
        variant: 'success',
        onClick: this._checkInFavoritesGuest.bind(this)
      }]
    };
  };

  // Show stay time period decider on both transfer and edit properties modal.
  async showRequiredEditPropFields(){
    var editPropertiesFields = {
      'updatePrice' : {restrictShow: this.isTransferOnSameType},
      'extraBeds': {restrictShow: this.isTransferOnSameType},
      'timePeriod': {restrictShow: !this.autoDecideStayTimePeriod}
    };
    await updateMultipleMetadataFields(editPropertiesFields, this.state.editPropertiesFields, (updatedData) => this.setState({editPropertiesFields: updatedData}));
  };

  // Edit properties custom modal body view!
  _editPropertiesCustomModalBodyView(){
    return editPropertiesBodyView(this.state.editPropertiesFields, (updatedData) => this.setState({editPropertiesFields: updatedData}));
  };

  // Favorites checkin form sub child view.
  _checkInFormView(){
    var options = {roomModel: this.roomDetails.selectedRoomModel, userModel: this.state.data.userModel,
      routerController: () => this.routerController(), roomStatusConstant: this.roomConstant, routerOptions: (opts) => this.props.getRouterOptions(opts),
      dashboardController: (opts) => this.onCloseCustomModal() && this.props.dashboardController(opts), onFormSave: this.state.data.onFormSave,
      params: this.params, afterFormSave: (opts) => this.state.data.filterTableOptions.afterSave(opts)};
    options['userStatusMap'] = CollectionInstance.getCollections('userStatusMap').data;
    return favoritesCheckInFormView(options);
  };

  // Get edit prop modal information!
  getEditPropModalInfo(){
    var modalHeader = filterTableConstants.promptErrorDialog.header({nextRoom: this.roomDetails.nextRoom, currentRoomType: this.roomDetails.currentRoomType,
    nextRoomType: this.roomDetails.nextRoomType});
    return {
      header: modalHeader,
      footerEnabled: true,
      restrictBody: false,
      showBodyItemView: () => this._editPropertiesCustomModalBodyView(this),
      footerButtons: [{
        btnId: filterTableConstants.promptErrorDialog.footerButtons.cancelBtn,
        variant: 'secondary',
        onClick: this._performTransfer.bind(this)
      }, {
        btnId: filterTableConstants.promptErrorDialog.footerButtons.editPropsBtn,
        variant: 'success',
        onClick: this._updateProperties.bind(this)
      }]
    };
  };
  
  // Prepare expanded table view!
  setExpandedTableView(){
    this.state.metadataTableState.infoMessage = filterTableConstants.tableInfoMessage.ZERO_FILTER_MESSAGE;
    this.getTableHeaderValue();
    this.getFilteredData(); // Get the filtered data based on the filter applied by the user!
    return this.filteredModel[this.roomConstant];
  };
  
  // Filter room collection based on the room status constant!
  filterRoomCollection(){
    this.filteredModel = {}; // Reinitialize this filteredModel here to prevent duplicate data!
    // TableView accepts data in array of objects form!
    var roomConstant = this.props.data.selectedRoomConstant,
      roomCollections = CollectionInstance.getCollections('roomsListCollection'),
      self = this;
    if(this.filteredModel[roomConstant] === undefined){
      this.filteredModel[roomConstant] = [];
    }
    _.find(roomCollections.data, function(obj){
      if(obj.roomStatusConstant === roomConstant){
        self.filteredModel[roomConstant].push(obj);
      }
    });
    this.state.data?.filteredData && this._applyFilter();
  };
  
  // Filter action table cell view!
  filterActionCellView(index){
    if(this.extraColumnState === filterTableWrapperConstants.columnState.FILTER_COLUMN_STATE){
      return filterTableActionCellView(this.events, index);
    }
    if(this.extraColumnState === filterTableWrapperConstants.columnState.CHECKIN_COLUMN_STATE){
      return filterTableCheckInActionCellView(this.events, index);
    }
  };
  
  // Apply user selected filter data!
  _applyFilter(){
    var filterData = this.state.data?.filteredData;
    // this handle filter by room type!
    _.remove(this.filteredModel[this.props.data.selectedRoomConstant], function(obj){
        return obj.suiteName !== filterData.suiteType;
    });
    // this handle dateofcheckout filter!
    _.remove(this.filteredModel[this.props.data.selectedRoomConstant], function(obj){
      if(obj.prebookDateofCheckin.length > 0){
        for(var i = 0; i < obj.prebookDateofCheckin.length; i++){
          // Filter date of checkout should be always lesser than the prebook date of checkin!
          if(new Date(filterData.checkOutDate) >= new Date(obj.prebookDateofCheckin[i])){
            return true;
          }
        }
      }
    });
  };
  
  // Get the user model based on the userId!
  prepareCheckInUserModel(){
    var userId = Array.isArray(this.state.data?.roomModel.user) ? this.state.data?.roomModel.user[0] : this.state.data?.roomModel.user;
    if(!this.userCollection){
      this.userCollection = CollectionInstance.getCollections('userCollections').data;
    }
    var userModel = _.find(this.userCollection, function(obj){
      return obj._id === userId;
    });
    var userModelClone = _.clone(userModel); // Clone the userModel from userCollection to prevent the userCollection from getting updating!
    var filteredUserModel = filterKeysInObj(userModelClone, filterTableConstants.userModelRequiredKey);
    // Check in api takes aadharcard as aadhar and username as customername!
    filteredUserModel['aadhar'] = filteredUserModel.aadharcard;
    filteredUserModel['customername'] = filteredUserModel.username;
    // In case the booking was through channel manager, then we would want to add the updatedPrice in the filteredUserModel.
    filteredUserModel['isChannel'] = filteredUserModel.channel !== filterTableConstants.channelManager;
    if(filteredUserModel.isChannel && this.isTransferOnSameType){ // Update the price only if the both room types are same.
      filteredUserModel['updatePrice'] = this.state.data?.roomModel.totalAmount;
    }
    if(this.shouldUpdateProperties){ // this is added here to change the data when the user edited the nextRoom properties.
      // When the timePeriod checkbox is selected, the user wants to calculate the price based on the stay time period
      // which would be in hours in this case.
      this.editPropertiesFieldData.timePeriod && this._calculateHourlyPrice();
      filteredUserModel['updatePrice'] = this.editPropertiesFieldData.updatePrice;
      filteredUserModel['extraBeds'] = this.editPropertiesFieldData.extraBeds;
      this.editPropertiesFieldData.timePeriod && (filteredUserModel['oldRoomPrice'] = this.stayTimePeriodPrice);
    }
    // When we do transfer operation, we have to track who performed transfer operation.
    // Checkin-By would remain as the user who checked-in the guest initially.
    filteredUserModel['checkinBy'] = userModelClone.checkinBy;
    filteredUserModel['transferBy'] = getCurrentUser();
    // Remove the unused object keys to prevent confusion.
    delete filteredUserModel.aadharcard;
    delete filteredUserModel.username;
    return filteredUserModel;
  };
  
  // Get the room model with checkin details!
  prepareCheckinRoomDetails(){
    var timeDate = getTimeDate();
    var selectedRoomModel = this.roomDetails.selectedRoomModel;
    delete selectedRoomModel.actions;
    selectedRoomModel['lodgeId'] = this.props.params.accIdAndName[0];
    selectedRoomModel['roomid'] = selectedRoomModel._id;
    selectedRoomModel['channel'] = filterTableConstants.channelManager;
    selectedRoomModel['isPrebook'] = false;
    selectedRoomModel['checkin'] = brewDate.getFullDate("yyyy/mm/dd");
    selectedRoomModel['checkout'] = this.state.data?.filteredData.checkOutDate;
    selectedRoomModel['checkinTime'] = timeDate.getTime;
    selectedRoomModel['checkoutTime'] = timeDate.getTime;
    selectedRoomModel['dateTime'] = brewDate.getFullDate("dd/mmm") +  " " + brewDate.timeFormat(brewDate.getTime());
    // This here represents specially room transfer details only!
    selectedRoomModel['isRoomTransfered'] = true;
    selectedRoomModel['oldRoomNo'] = this.roomDetails.currentRoom;
    // When adding the old room price into the selected room model, GST mode has to be taken into account.
    selectedRoomModel['oldRoomPrice'] = this.state.data?.userModel.amount + (getIsExclusive() ? this.state.data?.userModel.stayGst : 0);
    selectedRoomModel['oldRoomStayDays'] = this.state.data?.userModel.stayeddays;
    return selectedRoomModel;
  };

  // Calculate hourly price based on the price per day only when timePeriod checkbox is selected,
  _calculateHourlyPrice(){
    var oneHourPrice = Number(this.roomDetails.currentRoomPricePerDay) / 24; // 24 being the hours of the day.
    this.stayTimePeriodPrice = Math.round(this.stayTimePeriod * oneHourPrice);
  };
  
  // Get room details of current and next room!
  async getRoomDetails(cellIndex){
    this.roomDetails = {currentRoom : this.state.data?.userModel?.roomno,
      nextRoom: this.state.metadataTableState.cellValues[cellIndex].roomno,
      currentRoomType: this.state.data?.userModel?.roomtype,
      nextRoomType: this.state.metadataTableState.cellValues[cellIndex].suiteName,
      selectedRoomModel: this.state.metadataTableState.cellValues[cellIndex],
      currentRoomPricePerDay: this.state.data?.roomModel?.price,
      checkinDateAndTime: this.state.data.userModel?.checkinDate + ' ' + this.state.data.userModel?.checkinTime};
    this.isTransferOnSameType = (this.roomDetails.currentRoomType === this.roomDetails.nextRoomType);
    this.stayTimePeriod = Number(brewDate.diffHours(this.roomDetails.checkinDateAndTime).slice(0, -10)); // stayTimePeriod would be in hours always.
    // -10 here because brewDate would return the result as {hours} hours ago, just to take only the hours, slicing the unwanted strings.
    this.autoDecideStayTimePeriod = this.stayTimePeriod < 24; // 24 being the hours of the day.
    // If the stay time period is lesser than 24 hours, then we are giving the control to decide the stay time period to the user.
    this.autoDecideStayTimePeriod && await this.showRequiredEditPropFields();
  };
  
  // Prompt transfer dialog!
  async promptTransferDialog(cellIndex){
    let modalInfo;
    // Before prompting the transfer dialog, Verify we got the mandatory fields from the user to proceed further with transfer operation.
    // In this case, Mandatory fields are date-of-checkout from the user.
    if(!this.state.data?.filteredData?.checkOutDate){
     // Trigger mandatory fields values are missing alert.
     modalInfo = this.getMandatoryFieldsMissingModalInfo();
    } else {
      await this.getRoomDetails(cellIndex); // Get room details of current and next room.
      modalInfo = this.isTransferOnSameType ? this.getTransferModalInfo() : this.getEditPropModalInfo();
    }
    this._prepareCustomModal(modalInfo);

  };

  // Prompt check-in dialog -->  This method is currently being used for favorites checkin.
  async promptCheckInDialog(cellIndex){
    await this.getRoomDetails(cellIndex);
    var modalInfo = this.getCheckInModalInfo();
    this._prepareCustomModal(modalInfo);
  };
  
  // Prepare checkout details!
  getCheckoutDetails(){
    var checkoutDetails = this.state.data?.userModel;
    checkoutDetails['isUserTransfered'] = true;
    checkoutDetails['transferedRoomNo'] = this.roomDetails.nextRoom;
    return checkoutDetails;
  };

  // Perform transfer action!
  async _performTransfer(){
    this.onCloseCustomModal();
    this._toggleTableLoader(true, true); // Enable the loader!
    // Get the user model by the userId.
    var checkoutDetails = this.getCheckoutDetails(), // This user model contains checkoutDetails, so that the user can be checkedout.
      checkinRoomDetails = this.prepareCheckinRoomDetails(),
      checkinUserDetails = this.prepareCheckInUserModel();
    Object.assign(checkinRoomDetails, checkinUserDetails);
    // First checkout the user from old room and then do the checkin!
    var checkoutResult = await this.checkoutUtils.onCheckout(checkoutDetails);
    if(checkoutResult.data.success){
      this.props.dashboardController({reloadSidepanel: {silent: true},
        updateUserCollection: {id: checkoutResult.data.updatedModel._id, action: 'CHECK-OUT'}, updatedModel: checkoutResult.data.updatedModel});
      // Add the history id in the params to support rest for room transfer history operation.
      checkinRoomDetails['historyId'] = checkoutResult.data.deletedUserModel._id;
      // When the checkout is successfully done, do the checkin!
      var checkinDetails = await checkInFormValue(checkinRoomDetails);
      if(checkinDetails.data.success){
        this.props.dashboardController({reloadSidepanel: {silent: true},
          updatedModel: checkinDetails.data.updatedModel, updateUserCollection: {updatedUserModel: checkinDetails.data.updatedUserModel, action: 'CHECK-IN'}});
        this._triggerInfoMessage(filterTableConstants.successOnTransfer.SUCCESS_ON_TRANSFER);
      } else {
        this._triggerInfoMessage(filterTableConstants.errorOnTransfer.ERROR_ON_CHECKIN);
      }
    } else {
      this._triggerInfoMessage(filterTableConstants.errorOnTransfer.ERROR_ON_CHECKOUT);
    }
  };

  // Update the nextRoom properties in case of room type mismatching and if the user wanted.
  async _updateProperties(){
    var updatePropFieldData = await validateFieldData(this.state.editPropertiesFields, (updatedData) => this.setState({editPropertiesFields: updatedData}));
    if(updatePropFieldData.length === 0){
      this.shouldUpdateProperties = true;
      this.editPropertiesFieldData = nodeConvertor(this.state.editPropertiesFields);
      await this._performTransfer();
    }
  };

  // Check-In favorites guest.
  _checkInFavoritesGuest(){
    this.state.data.onFormSave = true;
    this._updateStateValue(this.state.data);
  };

  // On back click command.
  onBackClick(){
      return new CommandsGoBack(this.templateHelpersData).execute();
  };
  
  // trigger error message on customModal!
  _triggerInfoMessage(header){
    this._toggleTableLoader(false);
    var customModalOptions = {
      header: header,
      centered: false,
      onHide: this.onBackClick.bind(this) // Call the super onBackClick method to update the state router model.
    };
    this._prepareCustomModal(customModalOptions);
  };
  
  // Set the table header state!
  _setTableHeaderState(){
    var tableHeaders = this.propertyStatusTableHeader[this.roomConstant],
      tableHeadersClone = _.clone(tableHeaders); // Cloning the original data to prevent it from appending to table.view data...
    if(!tableHeadersClone.includes(this.filterActionTableHeaderValue)){
      tableHeadersClone.push(this.filterActionTableHeaderValue);
    };
    this.state.metadataTableState.headerValue = tableHeadersClone;
  };
  
  // Set the table cell state!
  _setTableCellState(){
    var tableCells = this.state.metadataTableState.cellValues,
      tableCellsClone = _.clone(tableCells); // Cloning the original data to prevent it from appending to table.view data...
    tableCellsClone.map((options, index) => { // Since the table cell value is an array of object, mapping it and then adding the actions view!
      if(!options.actions){
        options.actions = this.filterActionCellView(index);
      }
    });
    this.state.metadataTableState.cellValues = tableCellsClone;
    this.shouldRender && this._toggleTableLoader(false);
    this.shouldRender = false;
  };
  
  // Set filter table state for header and cells!
  _setFilterTableState(){
    this._setUpFilterTableEvents();
    this._setTableHeaderState();
    this._setTableCellState();
  };
  
  // Table header value!
  getTableHeaderValue(){
    var userStatusMap = CollectionInstance.getCollections('userStatusMap').data;
    this.templateHelpersData.options.selectedRoomConstant = userStatusMap[this.props.data.selectedRoomConstant];
  };

  // Get the filtered data based on the filter applied by the user!
  getFilteredData(){
    this.filterEnabled = true; // So that in table view, table header and cell can be created accordingly!
    this.roomConstant = this.props.data.selectedRoomConstant;
    this.filterRoomCollection();
  };
  
  // Update the component state with newly added value!
  _updateStateValue(updatedValue){
    this.setState({data: updatedValue});
  };
  
  componentDidUpdate(){
    if(this.state.data.filteredData !== this.props.data.filteredData){
      this._updateStateValue(this.props.data);
      this.shouldRender = true; // This flag should only change to true when the filter data changes.
    };
  };

};

export default FilterTable;