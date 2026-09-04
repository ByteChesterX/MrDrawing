package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var words = []string{"kedi", "ev", "araba", "güneş", "ağaç", "balık", "uçak", "kitap", "top", "yıldız", "kalp", "çiçek", "dağ", "nehir", "roket"}

var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }, ReadBufferSize: 1024, WriteBufferSize: 1024}

type Room struct {
	sync.Mutex
	id      string
	players map[string]*Player
	word    string
	drawer  string
	timer   *time.Timer
}

type Player struct {
	id   string
	name string
	conn *websocket.Conn
	send chan []byte
	room *Room
	score int
}

type Hub struct {
	sync.Mutex
	queue map[string]*Player
	rooms map[string]*Room
}

var hub = &Hub{queue: make(map[string]*Player), rooms: make(map[string]*Room)}

func main() {
	http.HandleFunc("/ws", handleWS)
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) })
	http.Handle("/", http.FileServer(http.Dir("./public")))

	log.Println("MrDrawing Go server :8080 - E2.Micro optimized ~10MB RAM")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleWS(w http.ResponseWriter, r *http.Request) {
	c, _ := upgrader.Upgrade(w, r, nil)
	p := &Player{id: randID(), conn: c, send: make(chan []byte, 16)}
	go p.writeLoop()
	p.readLoop()
}

func (p *Player) readLoop() {
	defer func() {
		leaveRoom(p)
		hub.Lock()
		delete(hub.queue, p.id)
		hub.Unlock()
		p.conn.Close()
		close(p.send)
	}()
	p.conn.SetReadLimit(8192)
	p.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	p.conn.SetPongHandler(func(string) error { p.conn.SetReadDeadline(time.Now().Add(60 * time.Second)); return nil })
	for {
		_, msg, err := p.conn.ReadMessage()
		if err != nil {
			return
		}
		var m map[string]any
		if json.Unmarshal(msg, &m) != nil {
			continue
		}
		switch m["t"] {
		case "join":
			p.name, _ = m["name"].(string)
			if p.name == "" {
				p.name = "Oyuncu"
			}
			matchmaking(p)
		case "draw":
			if p.room != nil && p.room.drawer == p.id {
				broadcast(p.room, msg, "")
			}
		case "guess":
			if p.room == nil {
				continue
			}
			guess, _ := m["word"].(string)
			p.room.Lock()
			correct := guess == p.room.word
			word := p.room.word
			p.room.Unlock()
			if correct {
				p.score += 100
				broadcast(p.room, jsonMsg("correct", map[string]any{"by": p.name, "word": word, "scores": scores(p.room)}), "")
				nextRound(p.room)
			} else {
				broadcast(p.room, jsonMsg("guess", map[string]any{"from": p.name, "word": guess}), "")
			}
		case "clear":
			if p.room != nil && p.room.drawer == p.id {
				broadcast(p.room, msg, "")
			}
		}
	}
}

func (p *Player) writeLoop() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case msg, ok := <-p.send:
			if !ok {
				return
			}
			p.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if p.conn.WriteMessage(websocket.TextMessage, msg) != nil {
				return
			}
		case <-ticker.C:
			p.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			p.conn.WriteMessage(websocket.PingMessage, nil)
		}
	}
}

func matchmaking(p *Player) {
	hub.Lock()
	defer hub.Unlock()
	for _, q := range hub.queue {
		if q.id == p.id {
			continue
		}
		delete(hub.queue, q.id)
		room := &Room{id: randID(), players: map[string]*Player{p.id: p, q.id: q}, word: words[rand.Intn(len(words))]}
		p.room = room
		q.room = room
		if rand.Intn(2) == 0 {
			room.drawer = p.id
		} else {
			room.drawer = q.id
		}
		hub.rooms[room.id] = room
		notifyRoom(room)
		go roomTimer(room)
		return
	}
	hub.queue[p.id] = p
	p.send <- jsonMsg("waiting", nil)
}

func notifyRoom(r *Room) {
	for _, pl := range r.players {
		role := "guesser"
		if pl.id == r.drawer {
			role = "drawer"
		}
		pl.send <- jsonMsg("start", map[string]any{
			"role": role, "word": mapWord(r, pl.id), "opponent": opponentName(r, pl.id), "scores": scores(r),
		})
	}
}

func nextRound(r *Room) {
	r.Lock()
	r.word = words[rand.Intn(len(words))]
	for id := range r.players {
		if id != r.drawer {
			r.drawer = id
			break
		}
	}
	r.Unlock()
	notifyRoom(r)
	if r.timer != nil {
		r.timer.Stop()
	}
	go roomTimer(r)
}

func roomTimer(r *Room) {
	r.Lock()
	if r.timer != nil {
		r.timer.Stop()
	}
	r.timer = time.AfterFunc(90*time.Second, func() { nextRound(r) })
	r.Unlock()
}

func broadcast(r *Room, msg []byte, exclude string) {
	for id, pl := range r.players {
		if id == exclude {
			continue
		}
		select {
		case pl.send <- msg:
		default:
		}
	}
}

func leaveRoom(p *Player) {
	if p.room == nil {
		return
	}
	r := p.room
	broadcast(r, jsonMsg("opponent_left", nil), p.id)
	hub.Lock()
	delete(hub.rooms, r.id)
	hub.Unlock()
	for _, pl := range r.players {
		if pl.id != p.id {
			pl.room = nil
			pl.send <- jsonMsg("opponent_left", nil)
		}
	}
	if r.timer != nil {
		r.timer.Stop()
	}
}

func jsonMsg(t string, d any) []byte {
	m := map[string]any{"t": t}
	if d != nil {
		for k, v := range d.(map[string]any) {
			m[k] = v
		}
	}
	b, _ := json.Marshal(m)
	return b
}

func mapWord(r *Room, pid string) string {
	if r.drawer == pid {
		return r.word
	}
	return ""
}
func opponentName(r *Room, pid string) string {
	for id, pl := range r.players {
		if id != pid {
			return pl.name
		}
	}
	return ""
}
func scores(r *Room) map[string]int {
	s := make(map[string]int)
	for _, pl := range r.players {
		s[pl.name] = pl.score
	}
	return s
}
func randID() string { return time.Now().Format("150405.000") + string(rune(rand.Intn(26)+65)) }
