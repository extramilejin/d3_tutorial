export class Observable {
	observers: Array<Function>;
	constructor() {
		this.observers = [];
	}
	subscribe(f: Function) {
		this.observers.push(f);
	}
	unsubscribe(f: Function) {
		this.observers = this.observers.filter(function(subscriber) {return subscriber !== f});
	}
	async notify(data = undefined) {
		for(const observer of this.observers) {
			await observer(data);
		}
	}
}