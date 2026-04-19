export interface User {
  id:         number;
  first_name: string;
  last_name:  string;
  age:        number;
  created_at: number;
  updated_at: number;
}

export interface CreateUserDto {
  first_name: string;
  last_name:  string;
  age:        number;
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?:  string;
  age?:        number;
}
