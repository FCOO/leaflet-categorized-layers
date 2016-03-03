/****************************************************************************
RADIOCHECKBOX.JS
Methods to create and modify input elements e.q. <input type="checkbox">
*****************************************************************************/

;( function($, L, window, document, undefined){ //Uses $ as alias for jQuery and window as local variable.
//******************************************
  "use strict";

	/******************************************
	RadioGroup
	Creates a group of radio-buttons.
	onChange = function(id, selected, radioGroup)
	allowZeroSelected: boolean. If true it is allowed to des-select a selected radio-button.
	If allowZeroSelected=true onChange will also be called on the un-selected radio-input
	******************************************/
	//RadioGroup = function( id, onChange, allowZeroSelected ){
	function RadioGroup( id, onChange, allowZeroSelected ){
		this.id = id;
		this.onChange	= onChange;
		this.allowZeroSelected = allowZeroSelected;
		this.selectedIndex = -1;
		this.children = [];
	
		/******************************************
		addChild
		Adds a input:radio to the group
		The $inputRadio is beeing altered using $.fn.createRadioCheckbox if it hasn't allready happened
		******************************************/
		this.addChild = function addChild( $inputRadio ){
			//If the radio-button isn't created => create it!
			if (!$inputRadio.parent().hasClass('input-radio') )
				$inputRadio.createRadioCheckbox();
		
			//If allowZeroSelected=true the radiobox is changed to a checkbox looking like a radio-button
			if (this.allowZeroSelected)
				$inputRadio.attr('type' ,'checkbox');	  
		
			var $this = this;
			$inputRadio.data('radio-group-index', this.children.length);
		
			$inputRadio.change( function(){ $this._onChange( $(this).data('radio-group-index') ); });
			this.children.push( $inputRadio );
		};
	
		this._onChange = function _onChange( index ){ 
			if (this.allowZeroSelected && (this.selectedIndex > -1)){
			  //Unselect the current selected radio-button
				this.onChange( this.children[this.selectedIndex].attr('id'), false, this);
				this.children[this.selectedIndex].prop('checked', false);
			}
	
			//If it was a unselection of a radio-button => no selected
			this.selectedIndex = this.selectedIndex == index ? -1 : index;
	
			if (this.selectedIndex > -1)
				this.onChange( this.children[this.selectedIndex].attr('id'), true, this);
		};
	}
	
	window.RadioGroup = RadioGroup;
	
	/******************************************
	Create checkbox and radio-input
	<div class="input-radio|input-checkbox">	
		<input type="radio|checkbox" value="None" id="..." name=".."/>
		<label for="slideTwo"></label>
	</div>
	*******************************************/
	var nextCheckboxId = 0;
	$.fn.createRadioCheckbox = function( forceType ) {	
		//className = the class for the div-element around
		var className = '';
		
		if (forceType) {
			className = forceType;
            if (forceType == 'input-radio') {
                this.addClass('display-as-radio');
            }
        } else {
		  if (this.hasClass('display-as-checkbox')) {
			className = 'input-checkbox';
          } else {
			if (this.hasClass('display-as-radio'))
			    className = 'input-radio';				  
			else
				className = (this.attr('type') == 'checkbox') ? 'input-checkbox' : 'input-radio';
          }
        }

		//Check if the input-element already is 'created'
		if (this.parent().hasClass( className ))
			return this;  
		
		var id = this.attr('id');
		if (!id){
			//Create default id
			id = '_defaultCheckbox_' + nextCheckboxId++;
			this.attr('id', id);
		}
		//Add a <div> with class=className around the input-element
		this.before('<div></div>').prev().addClass(className).append(this);
	
		//Adding <label> after
		$('<label></label>').insertAfter(this).attr('for', id);
	
		return this;
	};
	//*******************************************
	
	
	
	/************************************************************************************
	checkboxGroup
	The input acts as checkbox for a group of checkbokes. The state of the input is updated
	when any of the child-input is changed and all the child can be changed by clicking the input
	************************************************************************************/
	$.fn.checkboxGroup = function() {
		this.data('is-checkbox-group', true );
		this.data('checkbox-children', []);
	
		/************************************************************************
		When click on group input the checked-state of all children chamges
		************************************************************************/
		this.click ( function (){
			var uncheckAllChild = $(this).prop('checked');
			//Set all child to opposite state and trigger click
			$.each( $(this).data('checkbox-children'), function( indexInArray, $child ){
				$child
					.prop('checked', !uncheckAllChild)
					.trigger('click'); 
			});
		});
	
		/************************************************************************
		trigger('clickchild') is called when any of the child input are clicked
		************************************************************************/
		this.on('clickchild', function () { 
			//Count the number of checked and unchecked children
			var childChecked = 0;
			var childUnchecked = 0;
			$.each( $(this).data('checkbox-children'), function( indexInArray, $child ){
				if ($child.prop('checked'))
					childChecked++;
				else
					childUnchecked++;
			});
			//Update the group-input
			$(this).toggleClass('semi-selected', childChecked*childUnchecked !== 0);
			$(this).prop('checked', childChecked ? true : false);
		});
		return this;
	}; //$.fn.checkboxGroup = function() {..
	
	/**************************************
	checkboxGroupAddChild
	**************************************/
	$.fn.checkboxGroupAddChild = function( child ){
		var $this = this;
		child.data('checkbox-parent', this);
		var list = this.data('checkbox-children');
		list.push(child);
		this.data('checkbox-children', list);
		//Call the trigger for 'childclick' for the group-input
		child.click( function () { $this.trigger('clickchild'); });
		this.trigger('clickchild'); 
	};
	
	/**************************************
	checkboxGroupRemoveChild
	Remove child from the checkboxGroup
	**************************************/
	$.fn.checkboxGroupRemoveChild = function( child ){ 
		child.data('checkbox-parent', this);
		var list = this.data('checkbox-children');
		for (var i=0; i<list.length; i++ )
			if (list[i].get(0) == child.get(0)){ 
			  list.splice(i, 1);
				break;
			}
		this.data('checkbox-children', list);
		this.trigger('clickchild'); 
	};
	
	/**************************************
	removeFromCheckboxGroup
	Remove this from the checkboxGroup
	**************************************/
	$.fn.removeFromCheckboxGroup = function(){
		var checkboxGroup = this.data('checkbox-parent'); 
		if (checkboxGroup)
			checkboxGroup.checkboxGroupRemoveChild( this );
	};
	
	
	/**************************************
	checkbox_updateCheckboxGroup
	Update the checkboxGroup of this
	**************************************/
	$.fn.checkbox_updateCheckboxGroup = function(){
		var checkboxGroup = this.data('checkbox-parent'); 
		if (checkboxGroup)
			checkboxGroup.trigger('clickchild'); 
	};
	
	
	
	
	/******************************************
	Initialize checkbox and radio-input
	*******************************************/
	$(function() {	
		$('input:radio, input:checkbox').each ( function () { $(this).createRadioCheckbox(); });
	});
	
	
	
	
	
	
//*******************************************
})(jQuery, L, this, document);
