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
	export class TimelineEvent {
	    id: number;
	    type: string;
	    action: string;
	    details: string;
	    timestamp: string;
	    profile_name?: string;
	    status: string;
	    user?: string;
	    duration?: string;
	
	    static createFrom(source: any = {}) {
	        return new TimelineEvent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.action = source["action"];
	        this.details = source["details"];
	        this.timestamp = source["timestamp"];
	        this.profile_name = source["profile_name"];
	        this.status = source["status"];
	        this.user = source["user"];
	        this.duration = source["duration"];
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
	export class HostMapping {
	    id: number;
	    hostname: string;
	    ip: string;
	    port: number;
	    protocol: string;
	    active: boolean;
	
	    static createFrom(source: any = {}) {
	        return new HostMapping(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.hostname = source["hostname"];
	        this.ip = source["ip"];
	        this.port = source["port"];
	        this.protocol = source["protocol"];
	        this.active = source["active"];
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

