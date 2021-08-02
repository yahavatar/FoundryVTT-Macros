/*
    Questions:
        * Which NPCs get multi-attacks, how many attacks, at what CR
        
        * Armor
            Need a better way to hand out armor
            When to add a shield
              
        * 
          




    Items (Magic Items)
    Loot
    

    Non-Human NPCs (Creatures)
        Features
        
        
        
    New Options
        * Have Percentage chance/cr for each selected creature to become a definite class
            Checkbox    and     dropdown percentage picker
            
            
    Add more randomness to HP
    
    Last Update: 2021.07.28a
*/


dialog_options();

async function main(opt){
    opt.npc_count = await npc_count_get();
    opt.party_level_average = await party_level_average_get()

    for (let token of canvas.tokens.controlled){    //Loop through all selected tokens
        if (token.actor.type != "npc"){ continue; } //Skip it if it's not an npc

        let TADD = token.actor.data.data;           //Used for READING data from token
        let AD   = "actorData.data.";               //Used for WRITING data to token

        //Reset some params for each token
        let tok = [];                               //tok = temp object holding adjustments.
        tok.abilities = [];                         
        tok.data_to_update = [];
        tok.items_to_add = [];
        tok.items_to_delete = [];
        tok.items_updates = [];
        tok.opt = opt;                              //tok.opt = options from HTML dialog form
        
        //CR and adjustment_factor
        tok.cr = TADD.details.cr;
        if (tok.cr < 1){ tok.cr = 1; }
        tok.cr_orig = TADD.details.cr_orig;
        if (!tok.cr_orig){
            tok.cr_orig = tok.cr;
            tok.data_to_update[AD+"details.cr_orig"] = tok.cr_orig;
        }
        tok.cr_new = tok.cr + opt.cr_change;
        if (tok.cr_new < 1){ tok.cr_new = 1; }
        tok.data_to_update[AD+"details.cr"] = tok.cr_new;
        tok.cr_change_since_orig = tok.cr_new - tok.cr_orig;
        tok.adjust_factor = tok.cr_new / tok.cr_orig;
        tok.max_spell_level = spell_level_get_max(tok.cr_new);

        //Misc Token info
        tok.alignment = TADD.details.alignment;                       //Alignment
        tok.race = TADD.details.race
        tok.type = is_humanoid(TADD.details.type.value);              //Type of NPC (Humanoid, etc)

        //Use Templates for as much as we can!
        let pack = await game.packs.get(tok.opt.template)             //Read template based on Dialog Option
        console.log(pack);
        let template_items = await pack.getContent();                 //Get all template content (items)
        console.log(template_items);

        //Loop through all template compendium items
        for (let item of template_items){
            if (item.name.indexOf("Scale NPC Ability")>-1 && tok.opt.adjust_abilities){ tok.items_to_add.push([item.pack, item.name]); }
            if (item.name === "Scale NPC AC" && tok.opt.adjust_ac){ tok.items_to_add.push([item.pack, item.name]); }
            if (item.name === "Scale NPC HP" && tok.opt.adjust_hp){ tok.items_to_add.push([item.pack, item.name]); }
            if (item.name === "Scale NPC Movement" && tok.opt.adjust_movement){ tok.items_to_add.push([item.pack, item.name]); }
            if (item.type === "spell" && tok.opt.adjust_spells){
                if (item.data.data.level <= tok.max_spell_level){
                    tok.items_to_add.push([item.pack, item.name]);
                }
            }
            if (item.name === "Flag - Armor" && opt.adjust_armor){
                let armor_plus_str = await armor_get(tok);
                tok.items_to_add.push(["dnd5e.items", armor_plus_str])
            }
            if (item.name === "Flag - Weapons" && opt.adjust_weapons){
                let weapon_melee_str = await weapon_melee_get(tok);
                tok.items_to_add.push(["dnd5e.items", weapon_melee_str]);
                let weapon_range_str = await weapon_range_get(tok);
                tok.items_to_add.push(["dnd5e.items", weapon_range_str]);
            }
            
            if (item.name === "weapon" && !tok.is_humanoid){
                let dam = "";
                let dam_type = "";
                let dam_orig = item.data.data.damage.orig_dam;
                if (dam_orig){
                    dam = "(" + dam_orig + ") * " + tok.adjust_factor;
                    dam_type = item.data.data.damage.orig_type;
                } else {
                    dam = item.data.data.damage.parts[0][0];
                    dam_orig = dam;
                    dam = "(" + dam + ") * " + tok.adjust_factor;
                    dam_type = item.data.data.damage.parts[0][1];

                    tok.items_updates.push({
                        _id:item.id, 
                        data:{
                            damage:{
                                orig_dam: dam_orig,
                                orig_type: dam_type
                            }
                        }
                    });
                }
                tok.items_updates.push({
                    _id:item.id, 
                    data:{
                        damage:{
                            parts: [[dam, dam_type]]
                        }
                    }
                });
            }
            console.log(tok.items_updates);
            await items_update(token, tok);
        }
        
        //Update token if humanoid, non-humanoid, both
        if (!tok.is_humanoid){
            //Upgrade size?
            //Add features
                //Always add multi-Attack
        } else {
        
            
        }
        
        
        

        //Do all updates that need done to this token
        await item_types_remove(token, tok);                //Remove all selected item types
        await items_add(token, tok.items_to_add);           //Add all items
        await items_equip_all(token);                       //Equip, identify, make proficient all items
        await token.document.update(tok.data_to_update);    //Update all token data at once!
        await token.actor.longRest({ dialog: false });      //Refresh spellslots and hp

        console.log(tok);
        console.log(token);
        console.log(token.actor.data.data);
        
        
    }
    console.log("Finished processing tokens...");

}

            

            


        // Do they have a shield?

    
        
        // Maybe later =============================================
        //Upgrade weapons
        //    Club -> Mace -> Great Mace
        
        
        


        //Add some languages?
        
        //Add special senses?


        //Adjust Age


/*=================================================================
    Functions
  =================================================================*/
async function armor_get(tok){
    let armor = [];
    armor.push("None");                     // 10 1
    armor.push("Padded Armor");             // 11 2
    armor.push("Leather Armor");            // 11 3
    armor.push("Studded Leather Armor");    // 12 4
    armor.push("Hide Armor");               // 12 5
    armor.push("Chain Shirt");              // 13 6
    armor.push("Breastplate");              // 14 7
    armor.push("Ring Mail");                // 14 8
    armor.push("Scale Mail");               // 14 9
    armor.push("Half Plate Armor");         // 15 10
    armor.push("Chain Mail");               // 16 11
    armor.push("Splint Armor");             // 17 12
    armor.push("Plate Armor");              // 18 13
    let armor_number = 0;
    if (tok.cr_new > 0 && tok.cr_new < 5){ armor_number = roll_simple(4); }
    if (tok.cr_new > 4 && tok.cr_new < 9){ armor_number = roll_simple(4) + 4; }
    if (tok.cr_new >= 10){                 armor_number = roll_simple(4) + 8; }
    
    //Add a plus to the armor
    let armor_plus = parseInt(tok.cr_new / 4);
    let armor_plus_str = "";
    if (armor_plus == 0){
        armor_plus_str = armor[armor_number];
    } else if (armor_plus > 3){
        armor_plus_str = armor[armor_number] + " +3";
    } else {
        armor_plus_str = armor[armor_number] + " +" + armor_plus;
    }
    return armor_plus_str;
}
async function can_cast_spells(token){
    let spellcasting = false;
    for (let i of token.actor.items){
        if (i.data.name == "Spellcasting"){
            spellcasting = true;
        }
    }
    return spellcasting;
}
function is_humanoid(type){
    if (["celestial","fey","fiend","giant","humanoid"].includes(type)){
        return true;
    } else {
        return false;
    }
}

async function item_types_remove(token, tok){
    let item_types_to_delete = [];
    if (tok.opt.clear_armor){    item_types_to_delete.push("equipment"); }
    if (tok.opt.clear_features){ item_types_to_delete.push("feat"); }
    if (tok.opt.clear_spells){   item_types_to_delete.push("spell"); }
    if (tok.opt.clear_weapons){  item_types_to_delete.push("weapon"); }
    for (let i of token.actor.items){
        if (item_types_to_delete.includes(i.type)){
            tok.items_to_delete.push(i._id);
        }
    }
    await items_delete(token, tok.items_to_delete)
}

async function items_add(token, items) {
    let entities = []
    for (let i of items){
        let pack = await game.packs.get(i[0]);
        let index = await pack.getIndex();
        let entry = await index.find(e => e.name === i[1]);
        
        //console.log(entry)
        
        let entity = await pack.getDocument(entry._id);
        entities.push(entity.data.toObject());
    }
    //console.log(entities);
    await token.actor.createEmbeddedDocuments("Item", entities);
}

async function items_delete(token, items){
    await token.actor.deleteEmbeddedDocuments( "Item", items );
}
//token.actor.deleteEmbeddedDocuments("ActiveEffect", [effect.id]);

async function items_equip_all(token){
    for (let i of token.actor.items){
        if (i.type == "equipment" || i.type == "weapon"){
            await item_equipped_identified_proficient(token, i)
        }
    }
}

async function item_equipped_identified_proficient(token, item){
    await token.actor.updateEmbeddedDocuments("Item", [{
        _id:item.id, 
        data:{
            equipped: true,
            identified: true,
            proficient: true
        }
        }]
    );
}

async function items_update(token, tok){
    await token.actor.updateEmbeddedDocuments("Item", tok.items_updates);
}

function npc_count_get(){
    let npc_count = 0;
    for (let t of canvas.tokens.controlled){
        npc_count++;
    }
    return npc_count;
}
function party_level_average_get(){
    let party_count = 0;
    let party_level_total = 0;
    //console.log(canvas.tokens.placeables)
    for (let t of canvas.tokens.placeables){
        if (t.actor){
            let a = game.actors.get(t.actor.id);
            if (a.data.type){
                if (a.data.type != "npc"){
                    party_count++;
                    for (const [key, value] of Object.entries(a.data.data.classes)) {
                        party_level_total += value.levels;
                    }
                }
            }
        }
    }
    return parseInt(party_level_total / party_count);
}

function roll_simple(d){
    return Math.floor(Math.random() * d) + 1
}
function roll_no1_no2(qty, d){
    let total = 0;
    for (let i = 0; i < qty; i++){
        let r = Math.floor(Math.random() * d) + 1
        if (r < 3){ r = 3; }
        total = total + r;
    }
    return total;
}

async function spells_get(tok){
    let spell_count_by_level = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 2, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 3, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 4, 2, 0, 0, 0, 0, 0, 0, 0],
      [1, 4, 3, 0, 0, 0, 0, 0, 0, 0],
      [1, 4, 3, 2, 0, 0, 0, 0, 0, 0],
      [1, 4, 3, 3, 0, 0, 0, 0, 0, 0],
      [1, 4, 3, 3, 1, 0, 0, 0, 0, 0],
      [1, 4, 3, 3, 2, 0, 0, 0, 0, 0],
      [1, 4, 3, 3, 3, 1, 0, 0, 0, 0],
      [1, 4, 3, 3, 3, 2, 0, 0, 0, 0],
      [1, 4, 3, 3, 3, 2, 1, 0, 0, 0],
      [1, 4, 3, 3, 3, 2, 1, 0, 0, 0],
      [1, 4, 3, 3, 3, 2, 1, 1, 0, 0],
      [1, 4, 3, 3, 3, 2, 1, 1, 0, 0],
      [1, 4, 3, 3, 3, 2, 1, 1, 1, 0],
      [1, 4, 3, 3, 3, 2, 1, 1, 1, 0],
      [1, 4, 3, 3, 3, 2, 1, 1, 1, 1],
      [1, 4, 3, 3, 3, 3, 1, 1, 1, 1],
      [1, 4, 3, 3, 3, 3, 2, 1, 1, 1],
      [1, 4, 3, 3, 3, 3, 2, 2, 1, 1]
    ];

    //Add all spells per level
    let all_spells = [];
    let cr = tok.cr_new;
    if (cr > 20){ cr = 20;};
    for (let i=0; i<10; i++){
        let spell_count = spell_count_by_level[cr][i];
        console.log("i: " + i + ", Spell_Count: " + spell_count)
        if (spell_count > 0){
            let spell_list = tok.template.spell_list[i];
            //console.log(spell_list)
            for (let spell of spell_list){
                //console.log(spell)
                //all_spells.push(spell)
                all_spells.push(spell);
            }
        }
    }
    return all_spells;
}

function spell_level_get_max(cr){
    let l = 0;
    if (cr >0) l = 1;
    if (cr >2) l = 2;
    if (cr >4) l = 3;
    if (cr >6) l = 4;
    if (cr >8) l = 5;
    if (cr >10) l = 6;
    if (cr >12) l = 7;
    if (cr >14) l = 8;
    if (cr >16) l = 9;
    return l;
}

async function template_choose(tok){
    let template = [];
    let type = tok.opt.template_str;

    //Even if "generic" was chosen, use some sense to figure out what kind of NPC we are dealing with
    if (tok.type == "humanoid"){
        if (type == "generic"){
            //Figure out if npc can cast spells
            if (tok.spellcasting){
                if (tok.spellcaster_type == "wis"){
                    template.class = "cleric";
                } else {
                    template.class = "wizard";
                }            
            } else {
                template.class = "fighter";
            }
        }
    } else {
        //Non-Humanoid
        template.class = "non-humanoid";
    }
    switch(template.class){
        case "cleric":
            template.class = "Cleric";
            template.attributes = ["con","dex","wis"];
            template.spell_list = [
                ["Light"],
                ["Cure Wounds","Healing Word","Inflict Wounds","Protection from Evil and Good","Sanctuary","Shield of Faith"],
                ["Aid","Blindness/Deafness","Hold Person","Lesser Restoration","Prayer of Healing","Silence","Spiritual Weapon"],
                ["Animate Dead","Bestow Curse","Dispel Magic","Glyph of Warding","Mass Healing Word","Magic Circle","Meld into Stone","Revivify","Water Walk"],
                ["Banishment","Control Water","Death Ward","Freedom of Movement","Guardian of Faith","Stone Shape"],
                ["Contagion","Dispel Evil and Good","Geas","Greater Restoration","Insect Plague","Mass Cure Wounds","Raise Dead"],
                ["Blade Barrier","Create Undead","Harm","Heal","Word of Recall"],
                ["Conjure Celestial","Divine Word","Etherealness","Fire Storm","Plane Shift","Regenerate","Resurrection"],
                ["Antimagic Field","Control Weather","Earthquake"],
                ["Gate","Mass Heal","True Resurrection"]
            ];
            break;
        case "fighter":
            template.class = "Fighter";
            template.attributes = ["dex","wis","str"];
            template.spell_list= [];
            break;
        case "non-humanoid":
            template.class = "Non-Humanoid";
            template.attributes = ["con","dex","str"];
            template.spell_list= [];
            break;
        case "wizard":
            template.class = "Wizard";
            template.attributes = ["con","dex","int"];
            template.spell_list = [
                ["Chill Touch","Poison Spray","Ray of Frost"],
                ["Burning Hands","Feather Fall","Mage Armor","Magic Missile","Sleep"],
                ["Darkness","Detect Thoughts","Hold Person","Invisibility","Knock","Ray of Enfeeblement","Scorching Ray","See Invisibility","Spider Climb","Web","Levitate"],
                ["Animate Dead","Dispel Magic","Fear","Fireball","Fly","Haste","Lightning Bolt","Slow","Vampiric Touch"],
                ["Banishment","Black Tentacles","Greater Invisibility","Ice Storm","Phantasmal Killer","Stoneskin","Wall of Fire"],
                ["Cloudkill","Cone of Cold","Dominate Person","Teleportation Circle","Wall of Force"],
                ["Chain Lightning","Circle of Death","Disintegrate", "Globe of Invulnerability"],
                ["Finger of Death","Plane Shift","Reverse Gravity","Teleport"],
                ["Mind Blank","Maze","Power Word Stun"],
                ["Imprisonment","Meteor Swarm","Power Word Kill"]
            ];
            break;
    }
    console.log(template);
    return template;
}

async function token_update(token, tok){
    await token.document.update(tok.data_to_update);
}

async function weapon_melee_get(tok){
    let weapon_m = [];
    weapon_m.push("Dagger");
    weapon_m.push("Greatsword");
    weapon_m.push("Longsword");
    weapon_m.push("Mace");
    weapon_m.push("Shortsword");
    weapon_m.push("Greataxe");
    weapon_m.push("Battleaxe");
    weapon_m.push("Handaxe");
    weapon_m.push("Maul");
    weapon_m.push("Spear");
    weapon_m.push("Scimitar");
    weapon_m.push("Flail");
    weapon_m.push("Quarterstaff");
    weapon_m.push("Glaive");
    weapon_m.push("Halberd");
    weapon_m.push("Lance");
    weapon_m.push("Light Hammer");
    weapon_m.push("Morningstar");
    weapon_m.push("Pike");
    weapon_m.push("Rapier");
    weapon_m.push("Sickle");
    weapon_m.push("Trident");
    weapon_m.push("War Pick");
    weapon_m.push("Warhammer");
    weapon_m.push("Whip");
    let weapon_melee_number = roll_simple(25) - 1;
    //Add a plus to the weapons
    let weapon_plus = parseInt(tok.cr_new / 4);
    let weapon_plus_str = "";
    if (weapon_plus == 0){
        weapon_plus_str = weapon_m[weapon_melee_number];
    } else if (weapon_plus > 3){
        weapon_plus_str = weapon_m[weapon_melee_number] + " +3";
    } else {
        weapon_plus_str = weapon_m[weapon_melee_number] + " +" + weapon_plus;
    }
    return weapon_plus_str;
}
async function weapon_range_get(tok){
    let weapon_r = [];
    weapon_r.push("Blowgun");
    weapon_r.push("Dart");
    weapon_r.push("Javelin");
    weapon_r.push("Spear");
    weapon_r.push("Sling");
    weapon_r.push("Shortbow");
    weapon_r.push("Longbow");
    weapon_r.push("Heavy Crossbow");
    weapon_r.push("Hand Crossbow");
    weapon_r.push("Light Crossbow");
    let weapon_range_number = roll_simple(10) - 1;
    //Add a plus to the weapons
    let weapon_plus = parseInt(tok.cr_new / 4);
    let weapon_plus_str = "";
    if (weapon_plus == 0){
        weapon_plus_str = weapon_r[weapon_range_number];
    } else if (weapon_plus > 3){
        weapon_plus_str = weapon_r[weapon_range_number] + " +3";
    } else {
        weapon_plus_str = weapon_r[weapon_range_number] + " +" + weapon_plus;
    }
    return weapon_plus_str;
}

//================================== Dialogs ==================================
function dialog_options(){
    console.log("dialog_options");
    
    //Read in templates
    //let t_html = '<option value="world.mj-template-generic" selected>Generic</option>';
    let t_html = `<option value="mj-template-generic" selected>MJ Template - Generic</option>`
    for (let pack of game.packs){
        let label = pack.metadata.label;
        let val = pack.metadata.package + "." + pack.metadata.name;
        if (label.indexOf("MJ Template")>-1 && label != "MJ Template - Generic"){
            t_html += `<option value="` + val + `">` + label + `</option>`
        }
    }
    
    
    let d = new Dialog({
        title: "NPC Upgrade Options",
        content: `
            <form>
                <div class="form-group">
                    <label>Adjust NPC CR:</label>
                    <select id="scale-npc-cr" name="scale-npc-cr">
                        <option value="-10">-10</option>
                        <option value="-9">-9 </option>
                        <option value="-8">-8</option>
                        <option value="-7">-7</option>
                        <option value="-6">-6</option>
                        <option value="-5">-5</option>
                        <option value="-4">-4</option>
                        <option value="-3">-3</option>
                        <option value="-2">-2</option>
                        <option value="-1">-1</option>
                        <option value="0" selected>0</option>
                        <option value="1">+1</option>
                        <option value="2">+2</option>
                        <option value="3">+3</option>
                        <option value="4">+4</option>
                        <option value="5">+5</option>
                        <option value="6">+6</option>
                        <option value="7">+7</option>
                        <option value="8">+8</option>
                        <option value="9">+9</option>
                        <option value="10">+10</option>
                    </select>
                </div>
                <hr>
                <div class="form-group">
                    <label>Template:</label>
                    <select id="npc_template" name="npc_template">
                        ` + t_html + `
                    </select>
                </div>
                <hr>
                <center><div>NPC Adjustments</div></center>
                <div class="form-group">    <label>Abilities:</label>     <input id='adjust_abilities' type='checkbox' checked /></div>
                <div class="form-group">    <label>Age:</label>           <input id='adjust_age' type='checkbox' checked /></div>
                <div class="form-group">    <label>Armor:</label>         <input id='adjust_armor' type='checkbox' checked /></div>
                <div class="form-group">    <label>HP:</label>            <input id='adjust_hp' type='checkbox' checked /></div>
                <div class="form-group">    <label>Movement:</label>      <input id='adjust_movement' type='checkbox' checked /></div>
                <div class="form-group">    <label>Size:</label>          <input id='adjust_size' type='checkbox' checked /></div>
                <div class="form-group">    <label>Spells:</label>        <input id='adjust_spells' type='checkbox' checked /></div>
                <div class="form-group">    <label>Weapons:</label>       <input id='adjust_weapons' type='checkbox' checked /></div>
                <hr>
                <center><div>Clear Current</div></center>
                <div class="form-group">    <label>Armor:</label>   <input id='armor_clear' type='checkbox' checked /></div>
                <div class="form-group">    <label>Features:</label><input id='feature_clear' type='checkbox' checked /></div>
                <div class="form-group">    <label>Spells:</label>  <input id='spells_clear' type='checkbox' checked /></div>
                <div class="form-group">    <label>Weapons:</label> <input id='weapons_clear' type='checkbox' checked /></div>
            </form>
        `,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: "Upgrade",
          callback: () => {
              //Get all options from Form
              let opt = [];
              let e = document.getElementById("scale-npc-cr");
              opt.cr_change = parseInt(e.options[e.selectedIndex].value);
              
              console.log("opt.cr_change: " + opt.cr_change);
              
              e = document.getElementById("npc_template");
              opt.template = e.options[e.selectedIndex].value;

              opt.adjust_abilities = document.getElementById("adjust_abilities").checked
              opt.adjust_ac        = document.getElementById("adjust_ac").checked
              opt.adjust_armor     = document.getElementById("adjust_armor").checked
              opt.adjust_hp        = document.getElementById("adjust_hp").checked
              opt.adjust_movement  = document.getElementById("adjust_movement").checked
              opt.adjust_spells    = document.getElementById("adjust_spells").checked
              opt.adjust_weapons   = document.getElementById("adjust_weapons").checked

              opt.clear_armor      = document.getElementById("armor_clear").checked
              opt.clear_features   = document.getElementById("armor_clear").checked
              opt.clear_spells     = document.getElementById("spells_clear").checked
              opt.clear_weapons    = document.getElementById("weapons_clear").checked

              main(opt);
          }
        },
        no: {
          icon: "<i class='fas fa-times'></i>",
          label: "Cancel"
        },
      },
      default: "yes"
    }).render(true);
}