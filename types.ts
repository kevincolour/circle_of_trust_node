export type Player = {
    id : string,
    position : number[],
    room : string,
    name? : string,
    score? : number
  }
  
export interface PlayersObject {
[socketID:string] : Player
}

export type GameState = {
players : PlayersObject,
}
export type RoomsGameState = {
[room:string] : GameState
}