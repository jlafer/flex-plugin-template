import React from 'react';
import { Actions, Manager, SideLink } from "@twilio/flex-ui";
import {setMyPageState} from '../../states';
import { MyIcon, MyIconActive } from "./MyIcon";

export default class SidebarMyButton extends React.Component {

	constructor(props, context) {
		super(props, context);
		this.handleClick = this.handleClick.bind(this);
	}

	handleClick() {
    const manager = Manager.getInstance();
    manager.store.dispatch( setMyPageState('PAGE_ACTIVE') );
		Actions.invokeAction("NavigateToView", { viewName: "my-page" });
	}

	render() {
		return (
			<SideLink
				{...this.props}
				icon={<MyIcon />}
				iconActive={<MyIconActive />}
				isActive={this.props.activeView === "my-page"}
				onClick={this.handleClick}
			>
				Custom Page Nav
			</SideLink>
		);
	}
}
