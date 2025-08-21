export namespace api {
	
	export class LogEntry {
	    id: number;
	    timestamp: string;
	    level: string;
	    source: string;
	    message: string;
	    profile_id?: number;
	    profile_name?: string;
	
	    static createFrom(source: any = {}) {
	        return new LogEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.timestamp = source["timestamp"];
	        this.level = source["level"];
	        this.source = source["source"];
	        this.message = source["message"];
	        this.profile_id = source["profile_id"];
	        this.profile_name = source["profile_name"];
	    }
	}

}

export namespace database {
	
	export class ActivityLog {
	    id: number;
	    profile_id: number;
	    profile_name: string;
	    action: string;
	    details: string;
	    timestamp: string;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new ActivityLog(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.profile_id = source["profile_id"];
	        this.profile_name = source["profile_name"];
	        this.action = source["action"];
	        this.details = source["details"];
	        this.timestamp = source["timestamp"];
	        this.status = source["status"];
	    }
	}
	export class Profile {
	    id: number;
	    name: string;
	    type: string;
	    listen: string;
	    remote: string;
	    username: string;
	    password: string;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new Profile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.listen = source["listen"];
	        this.remote = source["remote"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.status = source["status"];
	    }
	}

}

