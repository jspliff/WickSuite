-- {{TITLE}}
-- UI.lua — themed panel with Wick brand chrome
-- Brand spec: memory/reference_wick_brand_style.md

local _, ns = ...
local UI = {}
ns.UI = UI

-- ============================================================
-- Wick brand palette (locked) — do not drift
-- Fel #4FC778 · Void #0D0A14 · Shadow #171124 · Border #383058 · Text #D4C8A1
-- ============================================================
local C_BG          = { 0.051, 0.039, 0.078, 0.97 }
local C_HEADER_BG   = { 0.090, 0.067, 0.141, 1 }
local C_BORDER      = { 0.220, 0.188, 0.345, 1 }
local C_GREEN       = { 0.310, 0.780, 0.471, 1 }
local C_TEXT_NORMAL = { 0.831, 0.784, 0.631, 1 }

local BRACKET  = 10     -- arm length (px)
local HEADER_H = 22
local MIN_W, MIN_H = 260, 120

-- ============================================================
-- Chrome helpers (shared pattern across the Wick suite)
-- ============================================================
local function newTex(parent, layer, c)
    local t = parent:CreateTexture(nil, layer or "BACKGROUND")
    if c then t:SetColorTexture(c[1], c[2], c[3], c[4] or 1) end
    return t
end

-- Four 1px muted-purple edges.
local function addBorder(f)
    local top    = newTex(f, "BORDER", C_BORDER); top:SetPoint("TOPLEFT");    top:SetPoint("TOPRIGHT");    top:SetHeight(1)
    local bot    = newTex(f, "BORDER", C_BORDER); bot:SetPoint("BOTTOMLEFT"); bot:SetPoint("BOTTOMRIGHT"); bot:SetHeight(1)
    local left   = newTex(f, "BORDER", C_BORDER); left:SetPoint("TOPLEFT");   left:SetPoint("BOTTOMLEFT"); left:SetWidth(1)
    local right  = newTex(f, "BORDER", C_BORDER); right:SetPoint("TOPRIGHT"); right:SetPoint("BOTTOMRIGHT"); right:SetWidth(1)
end

-- Fel-green L-brackets, 10px arms, 2px thick, flush to corners.
-- If a resizeButton is passed, BOTTOMRIGHT bracket is parented to it so it acts as the grabber.
local function addCornerAccents(parent, resizeButton)
    for _, point in ipairs({ "TOPLEFT", "TOPRIGHT", "BOTTOMLEFT", "BOTTOMRIGHT" }) do
        local host = (point == "BOTTOMRIGHT" and resizeButton) or parent
        local h = host:CreateTexture(nil, "OVERLAY")
        h:SetColorTexture(unpack(C_GREEN))
        h:SetPoint(point, host, point, 0, 0)
        h:SetSize(BRACKET, 2)
        local v = host:CreateTexture(nil, "OVERLAY")
        v:SetColorTexture(unpack(C_GREEN))
        v:SetPoint(point, host, point, 0, 0)
        v:SetSize(2, BRACKET)
    end
end

-- ============================================================
-- Build — called once on ADDON_LOADED
-- ============================================================
local frame
function UI:Build()
    if frame then return end
    frame = CreateFrame("Frame", "{{NAMESPACE}}Frame", UIParent)
    frame:SetSize(400, 240)
    frame:SetPoint("CENTER")
    frame:SetMovable(true)
    frame:SetResizable(true)
    if frame.SetResizeBounds then frame:SetResizeBounds(MIN_W, MIN_H) end
    frame:EnableMouse(true)
    frame:RegisterForDrag("LeftButton")
    frame:SetScript("OnDragStart", frame.StartMoving)
    frame:SetScript("OnDragStop", frame.StopMovingOrSizing)
    frame:Hide()

    local bg = newTex(frame, "BACKGROUND", C_BG); bg:SetAllPoints()
    addBorder(frame)

    local header = newTex(frame, "ARTWORK", C_HEADER_BG)
    header:SetPoint("TOPLEFT",  1,  -1)
    header:SetPoint("TOPRIGHT", -1, -1)
    header:SetHeight(HEADER_H)
    local sep = newTex(frame, "ARTWORK", C_BORDER)
    sep:SetPoint("TOPLEFT",  1, -HEADER_H - 1)
    sep:SetPoint("TOPRIGHT", -1, -HEADER_H - 1)
    sep:SetHeight(1)

    local title = frame:CreateFontString(nil, "OVERLAY")
    title:SetFont("Fonts\\FRIZQT__.TTF", 12, "")
    title:SetTextColor(C_TEXT_NORMAL[1], C_TEXT_NORMAL[2], C_TEXT_NORMAL[3], 1)
    title:SetPoint("LEFT", frame, "TOPLEFT", 10, -HEADER_H / 2)
    title:SetText("{{TITLE}}")

    -- Resize grip in BOTTOMRIGHT (doubles as the corner bracket)
    local grip = CreateFrame("Button", nil, frame)
    grip:SetSize(BRACKET + 2, BRACKET + 2)
    grip:SetPoint("BOTTOMRIGHT", 0, 0)
    grip:EnableMouse(true)
    grip:SetScript("OnMouseDown", function(_, btn)
        if btn == "LeftButton" then frame:StartSizing("BOTTOMRIGHT") end
    end)
    grip:SetScript("OnMouseUp", function() frame:StopMovingOrSizing() end)

    addCornerAccents(frame, grip)

    self.frame = frame
end

function UI:Toggle()
    if not frame then self:Build() end
    if frame:IsShown() then frame:Hide() else frame:Show() end
end
